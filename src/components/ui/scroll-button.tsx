"use client"

import { type VariantProps } from "class-variance-authority"
import { ChevronDown } from "lucide-react"
import { useStickToBottomContext } from "use-stick-to-bottom"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ScrollButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string
  size?: VariantProps<typeof buttonVariants>["size"]
  variant?: VariantProps<typeof buttonVariants>["variant"]
}

function ScrollButton({
  className,
  size = "sm",
  variant = "outline",
  ...props
}: ScrollButtonProps) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()

  return (
    <Button
      className={cn(
        "h-10 w-10 rounded-full transition-all duration-150 ease-out",
        !isAtBottom
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-4 scale-95 opacity-0",
        className
      )}
      onClick={() => scrollToBottom()}
      size={size}
      variant={variant}
      {...props}
    >
      <ChevronDown className="h-5 w-5" />
    </Button>
  )
}

export { ScrollButton }
