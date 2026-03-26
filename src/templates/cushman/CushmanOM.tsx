'use client';

import type { CushmanOMData } from './types';
import './cushman.css';

// Import all pages
import { CoverPage } from './pages/CoverPage';
import { DisclaimerPage } from './pages/DisclaimerPage';
import { TableOfContents } from './pages/TableOfContents';
import { SectionDivider } from './components/SectionDivider';
import { ExecutiveSummary } from './pages/ExecutiveSummary';
import { InvestmentHighlights } from './pages/InvestmentHighlights';
import { PropertyDescription } from './pages/PropertyDescription';
import { PhotoGallery } from './pages/PhotoGallery';
import { LocationOverview } from './pages/LocationOverview';
import { CorporateNeighbors } from './pages/CorporateNeighbors';
import { Demographics } from './pages/Demographics';
import { InlandEmpire } from './pages/InlandEmpire';
import { TemeculaRegional } from './pages/TemeculaRegional';
import { MarketOverview } from './pages/MarketOverview';
import { TenantSummary } from './pages/TenantSummary';
import { TenantLeaseAbstract } from './pages/TenantLeaseAbstract';
import { RentRoll } from './pages/RentRoll';
import { MarketAssumptions } from './pages/MarketAssumptions';
import { CashFlow } from './pages/CashFlow';
import { BackCover } from './pages/BackCover';

interface CushmanOMProps {
  data: CushmanOMData;
  onSectionChange?: (index: number, newContent: string) => void;
}

export function CushmanOM({ data, onSectionChange }: CushmanOMProps) {
  return (
    <div className="om-document">
      {/* Page 1: Cover */}
      <CoverPage data={data} />

      {/* Page 2: Disclaimer */}
      <DisclaimerPage data={data} />

      {/* Page 3: Table of Contents */}
      <TableOfContents data={data} />

      {/* Page 4: Section Divider - Executive Summary */}
      <SectionDivider sectionNumber="01" sectionTitle={"EXECUTIVE\nSUMMARY"} />

      {/* Page 5: Executive Summary */}
      <ExecutiveSummary data={data} />

      {/* Page 6: Investment Highlights */}
      <InvestmentHighlights data={data} />

      {/* Page 7: Section Divider - Property Description */}
      <SectionDivider sectionNumber="02" sectionTitle={"PROPERTY\nDESCRIPTION"} />

      {/* Page 8: Property Description */}
      <PropertyDescription data={data} />

      {/* Page 9: Photo Gallery */}
      <PhotoGallery data={data} />

      {/* Page 10: Location Overview */}
      <LocationOverview data={data} />

      {/* Page 11: Corporate Neighbors */}
      <CorporateNeighbors data={data} />

      {/* Page 12: Demographics */}
      <Demographics data={data} />

      {/* Page 13: Section Divider - Area and Market */}
      <SectionDivider sectionNumber="03" sectionTitle={"AREA AND MARKET\nOVERVIEWS"} />

      {/* Page 14: Inland Empire */}
      <InlandEmpire data={data} />

      {/* Page 15: Temecula Regional */}
      <TemeculaRegional data={data} />

      {/* Page 16: Market Overview */}
      <MarketOverview data={data} />

      {/* Page 17: Section Divider - Tenant and Lease */}
      <SectionDivider sectionNumber="04" sectionTitle={"TENANT AND LEASE\nSUMMARIES"} />

      {/* Page 18: Tenant Summary */}
      <TenantSummary data={data} />

      {/* Page 19: Tenant Lease Abstract */}
      <TenantLeaseAbstract data={data} />

      {/* Page 20: Section Divider - Financials */}
      <SectionDivider sectionNumber="05" sectionTitle="FINANCIALS" />

      {/* Page 21: Rent Roll */}
      <RentRoll data={data} />

      {/* Page 22: Market Assumptions */}
      <MarketAssumptions data={data} />

      {/* Page 23: Cash Flow */}
      <CashFlow data={data} />

      {/* Page 24: Back Cover */}
      <BackCover data={data} />
    </div>
  );
}
