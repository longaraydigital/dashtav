"use client"

import { useState, useCallback } from "react"
import { CampaignFilters } from "@/components/campaigns/CampaignFilters"
import { CampaignTable, type CampaignRow } from "@/components/campaigns/CampaignTable"

interface CampaignsClientProps {
  rows: CampaignRow[]
}

export function CampaignsClient({ rows }: CampaignsClientProps) {
  const [filteredRows, setFilteredRows] = useState<CampaignRow[]>(rows)

  const handleFilter = useCallback((filtered: CampaignRow[]) => {
    setFilteredRows(filtered)
  }, [])

  return (
    <>
      <CampaignFilters rows={rows} onFilter={handleFilter} />

      <CampaignTable rows={filteredRows} />

      {filteredRows.length === 0 && rows.length > 0 && (
        <div className="dash-card text-center py-10">
          <p className="text-muted-foreground text-sm">
            Nenhuma campanha corresponde aos filtros aplicados.
          </p>
        </div>
      )}
    </>
  )
}
