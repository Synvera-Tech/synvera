export type CompositionItem = {
  public_id: string;
  name: string;
  sbn_procedure_id: string;
  sbn_procedure_name: string;
  access_route_type: "same" | "different";
  auxiliaries_count: number;
  requires_anesthesia: boolean;
  created_at: string;
};

export function compositionHref(publicId: string) {
  return `/procedure?composition=${encodeURIComponent(publicId)}`;
}
