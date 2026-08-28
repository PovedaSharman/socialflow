import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ApplicationFailure } from '@temporalio/common';
import { Client, Connection } from '@temporalio/client';
import { NativeConnection, Worker } from '@temporalio/worker';
import { publicationIdempotencyKey } from '@gitroom/nestjs-libraries/integrations/social/publication.idempotency';

const temporalDescribe =
  process.env.RUN_TEMPORAL_INTEGRATION_TESTS === 'true'
    ? describe
    : describe.skip;

jest.setTimeout(60_000);

temporalDescribe('post workflow duplicate safety', () => {
  it('publishes once after safe refresh and never repeats unknown outcomes', async () => {
    const address = process.env.TEMPORAL_ADDRESS || '127.0.0.1:7233';
    const namespace = process.env.TEMPORAL_NAMESPACE || 'default';
    const taskQueue = `publish-safety-${randomUUID()}`;
    const artifactDirectory = resolve(
      process.env.TEMPORAL_TEST_ARTIFACT_DIR || 'artifacts/temporal-post-safety'
    );
    mkdirSync(artifactDirectory, { recursive: true });

    let scenario: 'refresh' | 'unknown' | 'timeout' = 'refresh';
    let attempts = 0;
    let acceptedMutations = 0;
    let idempotencyKeys: string[] = [];
    let states: string[] = [];

    const post = {
      id: 'post-a',
      organizationId: 'organization-a',
      integrationId: 'integration-a',
      publishDate: new Date('2025-01-01T10:00:00.000Z'),
      releaseId: null,
      state: 'QUEUE',
      content: 'Safe local test post',
      settings: '{}',
      image: '[]',
      delay: 0,
      group: 'group-a',
      intervalInDays: null,
      integration: {
        id: 'integration-a',
        organizationId: 'organization-a',
        providerIdentifier: 'socialflow-test',
        name: 'Local test account',
        disabled: false,
        refreshNeeded: false,
      },
    };

    const activities = {
      getPostForWorkflow: async () => post,
      getPostsListForWorkflow: async () => [post],
      isCommentable: async () => false,
      isPublicationRetrySafe: async () => true,
      refreshCredentialWithCause: async () => true,
      postSocialPending: async (
        _integration: unknown,
        posts: (typeof post)[]
      ) => {
        const activeScenario = scenario;
        attempts++;
        const key = publicationIdempotencyKey(posts[0]);
        idempotencyKeys.push(key);

        if (activeScenario === 'refresh' && attempts === 1) {
          throw ApplicationFailure.nonRetryable(
            'Credential expired before publication',
            'refresh_token'
          );
        }

        acceptedMutations++;
        if (activeScenario === 'unknown') {
          throw new Error('Connection lost after provider acceptance');
        }
        if (activeScenario === 'timeout') {
          await new Promise((resolveTimer) => setTimeout(resolveTimer, 1_000));
        }

        return [
          {
            id: posts[0].id,
            postId: `local-${key}`,
            releaseURL: `socialflow-test://posts/local-${key}`,
            status: 'completed',
          },
        ];
      },
      updatePost: async () => undefined,
      inAppNotification: async () => undefined,
      changeState: async (_id: string, state: string) => {
        states.push(state);
      },
      sendWebhooks: async () => undefined,
      internalPlugs: async () => [],
      globalPlugs: async () => [],
    };

    const workerConnection = await NativeConnection.connect({ address });
    const clientConnection = await Connection.connect({ address });
    const client = new Client({ connection: clientConnection, namespace });
    const worker = await Worker.create({
      connection: workerConnection,
      namespace,
      taskQueue,
      workflowsPath: require.resolve('./post.workflow.v1.0.6'),
      activities,
    });

    const runScenario = async (
      nextScenario: typeof scenario,
      mutationStartToCloseTimeout = '10 seconds'
    ) => {
      scenario = nextScenario;
      attempts = 0;
      acceptedMutations = 0;
      idempotencyKeys = [];
      states = [];
      const workflowId = `publish-safety-${nextScenario}-${randomUUID()}`;

      await client.workflow.execute('postWorkflowV106', {
        workflowId,
        taskQueue,
        args: [
          {
            taskQueue,
            postId: post.id,
            organizationId: post.organizationId,
            mutationStartToCloseTimeout,
          },
        ],
      });

      const history = await client.workflow
        .getHandle(workflowId)
        .fetchHistory();
      const serializedHistory = JSON.stringify(
        history,
        (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      );
      writeFileSync(
        resolve(artifactDirectory, `${nextScenario}.history.json`),
        serializedHistory
      );
      expect(serializedHistory).not.toContain('credential-secret');
    };

    try {
      await worker.runUntil(async () => {
        await runScenario('refresh');
        expect(attempts).toBe(2);
        expect(acceptedMutations).toBe(1);
        expect(new Set(idempotencyKeys)).toHaveSize(1);

        await runScenario('unknown');
        expect(attempts).toBe(1);
        expect(acceptedMutations).toBe(1);
        expect(states).toContain('ERROR');

        await runScenario('timeout', '500 milliseconds');
        expect(attempts).toBe(1);
        expect(acceptedMutations).toBe(1);
        expect(states).toContain('ERROR');
      });
    } finally {
      await clientConnection.close();
      await workerConnection.close();
    }
  });
});
