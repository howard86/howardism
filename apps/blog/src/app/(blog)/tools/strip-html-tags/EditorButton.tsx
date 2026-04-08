"use client";

import { CheckIcon } from "@heroicons/react/24/outline";
import { Button } from "@howardism/ui/components/button";
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
    <Button
      className="join-item"
      onClick={handleClick}
      size="sm"
      title={success ? "Succeed" : tooltip}
      type="button"
      variant="default"
      {...props}
    >
      {success ? (
        <CheckIcon className="h-auto w-4" />
      ) : (
        <Icon className="h-auto w-4" />
      )}
    </Button>
  );
}
