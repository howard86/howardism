"use client";

import { CheckIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  type FC,
  type PropsWithoutRef,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ButtonProps, SVGProps } from "react-html-props";

interface EditorButtonProps extends ButtonProps {
  Icon: FC<PropsWithoutRef<SVGProps>>;
  onClick: VoidFunction;
  tooltip: string;
}

const DEFAULT_DELAY_MS = 800;

export default function EditorButton({
  tooltip,
  onClick,
  Icon,
  ...props
}: EditorButtonProps) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [success, setSuccess] = useState(false);

  const handleClick = () => {
    if (success) {
      return;
    }

    setSuccess(true);
    onClick();

    timeoutRef.current = setTimeout(() => {
      setSuccess(false);
    }, DEFAULT_DELAY_MS);
  };

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  return (
    <div
      className={clsx(
        "tooltip",
        success ? "tooltip-success" : "tooltip-accent"
      )}
      data-tip={success ? "Succeed" : tooltip}
    >
      <button
        className={clsx(
          "btn btn-primary join-item swap btn-sm",
          success && "swap-active"
        )}
        onClick={handleClick}
        type="button"
        {...props}
      >
        <CheckIcon className="swap-on h-auto w-4" />
        <Icon className="swap-off h-auto w-4" />
      </button>
    </div>
  );
}
