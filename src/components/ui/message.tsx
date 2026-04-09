import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { Markdown } from "./markdown"

export type MessageProps = React.HTMLProps<HTMLDivElement> & {
  children: React.ReactNode
  className?: string
}

const Message = ({ children, className, ...props }: MessageProps) => (
  <div className={cn("flex gap-3", className)} {...props}>
    {children}
  </div>
)

export type MessageAvatarProps = {
  alt: string
  className?: string
  delayMs?: number
  fallback?: string
  src: string
}

const MessageAvatar = ({
  alt,
  className,
  delayMs,
  fallback,
  src,
}: MessageAvatarProps) => {
  return (
    <Avatar className={cn("h-8 w-8 shrink-0", className)}>
      <AvatarImage alt={alt} src={src} />
      {fallback && (
        <AvatarFallback delayMs={delayMs}>{fallback}</AvatarFallback>
      )}
    </Avatar>
  )
}

export type MessageContentProps = React.ComponentProps<typeof Markdown> & React.HTMLProps<HTMLDivElement> &
  {
  children: React.ReactNode
  className?: string
  markdown?: boolean
}

const MessageContent = ({
  children,
  className,
  markdown = false,
  ...props
}: MessageContentProps) => {
  const classNames = cn(
    "rounded-lg p-2 text-foreground bg-secondary prose dark:prose-invert max-w-none break-words whitespace-normal",
    className
  )

  return markdown ? (
    <Markdown className={classNames} {...props}>
      {children as string}
    </Markdown>
  ) : (
    <div className={classNames} {...props}>
      {children}
    </div>
  )
}

export type MessageActionsProps = React.HTMLProps<HTMLDivElement> & {
  children: React.ReactNode
  className?: string
}

const MessageActions = ({
  children,
  className,
  ...props
}: MessageActionsProps) => (
  <div
    className={cn("text-muted-foreground flex items-center gap-2", className)}
    {...props}
  >
    {children}
  </div>
)

export type MessageActionProps = React.ComponentProps<typeof Tooltip> & {
  children: React.ReactNode
  className?: string
  side?: "bottom" | "left" | "right" | "top"
  tooltip: React.ReactNode
}

const MessageAction = ({
  children,
  className,
  side = "top",
  tooltip,
  ...props
}: MessageActionProps) => {
  return (
    <TooltipProvider>
      <Tooltip {...props}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className={className} side={side}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { Message, MessageAction, MessageActions, MessageAvatar, MessageContent }
