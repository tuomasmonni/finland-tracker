'use client';

interface SidebarFooterProps {
  collapsed: boolean;
}

export default function SidebarFooter({ collapsed }: SidebarFooterProps) {
  if (collapsed) {
    return (
      <div className="p-2 border-t border-white/10">
        <span className="block text-center text-[10px] text-zinc-600">
          tilannetieto.fi
        </span>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-white/10">
      <div className="flex items-center justify-end">
        <span className="text-[10px] text-zinc-600">
          tilannetieto.fi
        </span>
      </div>
    </div>
  );
}
