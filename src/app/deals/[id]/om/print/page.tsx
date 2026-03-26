'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase, BrokerDeal } from '@/lib/supabase';
import { WINCHESTER_SEED } from '@/lib/seed-data';
import { CushmanOM } from '@/templates/cushman/CushmanOM';
import type { CushmanOMData } from '@/templates/cushman/types';

export default function OMPrint() {
  const { id } = useParams<{ id: string }>();
  const [omData, setOmData] = useState<CushmanOMData | null>(null);

  useEffect(() => {
    async function load() {
      let deal: Partial<BrokerDeal> = WINCHESTER_SEED;

      if (id !== 'seed-winchester-001') {
        const { data } = await supabase
          .from('broker_deals')
          .select('*')
          .eq('id', id)
          .single();
        if (data) deal = data;
      }

      const draft = deal.om_draft as {
        sections?: { title: string; content: string }[];
        selectedPhotos?: string[];
        firmStyle?: string;
      } | null;

      setOmData({
        deal,
        sections: draft?.sections || [],
        selectedPhotos: draft?.selectedPhotos || deal.photos || [],
        firmStyle: draft?.firmStyle || deal.firm_style || 'cushman',
      });
    }
    load();
  }, [id]);

  if (!omData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Barlow, sans-serif' }}>
        Loading...
      </div>
    );
  }

  return <CushmanOM data={omData} />;
}
