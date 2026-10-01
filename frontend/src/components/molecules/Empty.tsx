import type { ComponentType, SVGProps } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty as EmptyComponent,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type EmptyProps = {
  title: string;
  description: string;
  buttonText?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  onButtonClick?: () => void;
};

function Empty({
  title,
  description,
  buttonText,
  onButtonClick,
  icon: Icon,
}: EmptyProps) {
  return (
    <EmptyComponent className="flex flex-col items-center justify-center gap-4">
      {Icon && (
        <EmptyMedia className="flex items-center justify-center h-20 w-20">
          <Icon />
        </EmptyMedia>
      )}

      <EmptyContent>
        <EmptyHeader>
          <EmptyTitle className="text-lg font-semibold">{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>

        {buttonText && onButtonClick && (
          <Button size="lg" onClick={onButtonClick}>
            {buttonText}
          </Button>
        )}
      </EmptyContent>
    </EmptyComponent>
  );
}

export default Empty;
