export interface Domain {
  id: string; // UUID
  domainName: string;
  ownerToken?: string; // em edição, pode ser omitido para não alterar
  zoneId: string;
}

