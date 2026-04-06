"use client"

import { StickToBottom } from "use-stick-to-bottom"

import { cn } from "@/lib/utils"

export type ChatContainerContentProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode
  className?: string
}

export type ChatContainerRootProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode
  className?: string
}

export type ChatContainerScrollAnchorProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string
  ref?: React.RefObject<HTMLDivElement>
}

function ChatContainerContent({
  children,
  className,
  ...props
}: ChatContainerContentProps) {
  return (
    <StickToBottom.Content
      className={cn("flex w-full flex-col", className)}
      {...props}
    >
      {children}
    </StickToBottom.Content>
  )
}

function ChatContainerRoot({
  children,
  className,
  ...props
}: ChatContainerRootProps) {
  return (
    <StickToBottom
      className={cn("flex overflow-y-auto", className)}
      initial="instant"
      resize="smooth"
      role="log"
      {...props}
    >
      {children}
    </StickToBottom>
  )
}

function ChatContainerScrollAnchor({
  className,
  ...props
}: ChatContainerScrollAnchorProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-px w-full shrink-0 scroll-mt-4", className)}
      {...props}
    />
  )
}

export { ChatContainerContent, ChatContainerRoot, ChatContainerScrollAnchor }
