import StatusCheckerClient from './client-page'
import { getActiveEvents } from './actions'

export const dynamic = 'force-dynamic'

export default async function StatusCheckerPage() {
    const { data: events } = await getActiveEvents()

    return <StatusCheckerClient events={events || []} />
}
