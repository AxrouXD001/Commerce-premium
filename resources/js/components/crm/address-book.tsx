import { Badge } from '@/components/ui/badge';
import type { CustomerAddressDto } from '@/types/crm';

export function AddressBook({ addresses }: { addresses: CustomerAddressDto[] }) {
    return (
        <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Direcciones</h2>
            {addresses.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay direcciones guardadas.</p>
            ) : (
                <ul className="flex flex-col gap-3">
                    {addresses.map((a) => (
                        <li key={a.id} className="bg-muted/30 rounded-xl border p-4 text-sm">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="font-medium">{a.label}</span>
                                {a.is_default ? <Badge variant="secondary">Principal</Badge> : null}
                            </div>
                            <p>{a.line1}</p>
                            {a.line2 ? <p>{a.line2}</p> : null}
                            <p className="text-muted-foreground mt-1">
                                {a.city}
                                {a.region ? `, ${a.region}` : ''}
                                {a.postal_code ? ` · ${a.postal_code}` : ''}
                            </p>
                            <p className="text-muted-foreground text-xs">{a.country}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
