'use client';

import {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  FC,
  useEffect,
  useRef,
  useState,
} from 'react';
import { clsx } from 'clsx';
const ReactLoading = ({
  color = 'currentColor',
  width = 20,
  height = 20,
}: {
  type?: string;
  color?: string;
  width?: number;
  height?: number;
}) => {
  const size = Math.min(width, height);
  const borderWidth = Math.max(2, Math.round(size / 8));
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        border: `${borderWidth}px solid transparent`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
};
export const Button: FC<
  DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > & {
    secondary?: boolean;
    loading?: boolean;
    innerClassName?: string;
  }
> = ({ children, loading, innerClassName, secondary, ...props }) => {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [height, setHeight] = useState(44);
  useEffect(() => {
    setHeight(ref.current?.offsetHeight || 40);
  }, []);
  return (
    <button
      {...props}
      type={props.type || 'button'}
      disabled={props.disabled || loading}
      aria-busy={loading || undefined}
      ref={ref}
      className={clsx(
        (props.disabled || loading) &&
          'opacity-50 cursor-not-allowed disabled:pointer-events-none',
        `${
          secondary
            ? 'bg-surface border border-subtleBorder text-content hover:bg-elevated'
            : 'bg-brand text-onBrand hover:bg-brandHover'
        } px-[24px] min-h-[44px] rounded-[8px] font-[600] cursor-pointer items-center justify-center flex relative transition-colors duration-150`,
        props?.className
      )}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <ReactLoading type="spin" width={height / 2} height={height / 2} />
          <span className="sr-only">Loading</span>
        </div>
      )}
      <div
        className={clsx(
          innerClassName,
          'flex-1 items-center justify-center flex',
          loading && 'invisible'
        )}
      >
        {children}
      </div>
    </button>
  );
};
