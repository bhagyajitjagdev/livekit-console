import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/layout/page-header"
import { RoomList } from "@/components/rooms/room-list"
import { roomsQuery } from "@/lib/queries"
import { useRefetchInterval } from "@/hooks/use-refetch-interval"

export const Route = createFileRoute("/_authed/rooms/")({
  component: RoomsPage,
})

function RoomsPage() {
  const refetchInterval = useRefetchInterval()
  const { data } = useQuery({ ...roomsQuery, refetchInterval })

  return (
    <>
      <PageHeader title="Rooms" />
      <div className="p-4">
        <RoomList rooms={data ?? []} />
      </div>
    </>
  )
}
