import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

/**
 * Runs a mutation, refetches every query behind the current page, and reports
 * the outcome. Returns whether it succeeded so callers can close their forms.
 */
export function useAction() {
  const queryClient = useQueryClient()
  const [pending, setPending] = useState(false)

  const run = async (
    action: () => Promise<unknown>,
    messages: { success: string; failure: string },
  ): Promise<boolean> => {
    setPending(true)
    try {
      await action()
      await queryClient.invalidateQueries()
      toast.success(messages.success)
      return true
    } catch (error) {
      toast.error(messages.failure, {
        description: error instanceof Error ? error.message : String(error),
      })
      return false
    } finally {
      setPending(false)
    }
  }

  return { run, pending }
}
