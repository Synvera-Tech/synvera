/**
 * Demo composition data based on real CBHPM structure
 * This data represents a realistic neurosurgery calculation
 */

export const compositionDemoData = {
  totalValue: 26263.16,
  procedure: {
    code: "3.14.01.15-5",
    description: "Microcirurgia para tumores intracranianos",
    porte: "14A",
  },
  components: [
    {
      description: "Tratamento cirúrgico da fístula liquórica",
      checked: true,
    },
    {
      description: "Reconstrução craniana ou craniofacial",
      checked: true,
    },
    {
      description: "Ressecção do osso temporal",
      checked: true,
    },
    {
      description: "Reconstrução com rotação do músculo temporal",
      checked: true,
    },
    {
      description: "Reconstrução com retalho da gálea aponeurótica",
      checked: true,
    },
  ],
  rule: {
    name: "CBHPM 4.1",
    description: "Mesma via de acesso",
    details: "Procedimentos adicionais valorados a 50%",
  },
  teamBreakdown: [
    {
      role: "Cirurgião Principal",
      amount: 11536.81,
      percentage: 43.9,
    },
    {
      role: "1º Auxiliar",
      amount: 6922.09,
      percentage: 26.3,
    },
    {
      role: "2º Auxiliar",
      amount: 4614.72,
      percentage: 17.6,
    },
    {
      role: "Anestesiologista",
      amount: 3189.54,
      percentage: 12.1,
    },
  ],
  sharing: {
    linkUrl: "https://afere.app/c/demo-composition",
    qrCode: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect fill='%23fff' width='120' height='120'/%3E%3Crect fill='%23000' x='10' y='10' width='100' height='100'/%3E%3C/svg%3E",
  },
};
