import { Partner } from './types';

export const BRAND_INFO = {
  name: "Aparece aí por aqui",
  instagram: "@apareceai.porqui",
  whatsapp: "(11) 93301-4850",
  email: "contato@apareceaporaqui.com.br"
};

export const CATEGORIES = [
  "Todos",
  "Alimentação",
  "Serviços",
  "Varejo",
  "Saúde",
  "Educação",
  "Outros"
];

export const PARTNERS_MOCK: Partner[] = [
  {
    id: '1',
    name: 'Pizzaria Bella Massa',
    category: 'Alimentação',
    activity: 'Alimentação / Gastronomia',
    description: 'A melhor pizza artesanal da região com bordas recheadas e ingredientes frescos.',
    address: 'Av. das Flores, 123 - Centro',
    imageUrl: 'https://picsum.photos/seed/pizza/800/600',
    link: 'https://instagram.com',
    coupon: 'BELLA10',
    isAuthorized: true,
    orderIndex: 1
  },
  {
    id: '2',
    name: 'Auto Mecânica Turbo',
    category: 'Serviços',
    activity: 'Serviços Automotivos',
    description: 'Especialistas em injeção eletrônica e manutenção preventiva para seu veículo.',
    address: 'Rua dos Motores, 45 - Industrial',
    imageUrl: 'https://picsum.photos/seed/car/800/600',
    link: 'https://google.com',
    isAuthorized: true,
    orderIndex: 2
  },
  {
    id: '3',
    name: 'Moda Viva Store',
    category: 'Varejo',
    activity: 'Varejo / Vestuário',
    description: 'Tendências da moda masculina e feminina com preços que cabem no seu bolso.',
    address: 'Shopping Norte, Loja 12 - Piso 2',
    imageUrl: 'https://picsum.photos/seed/fashion/800/600',
    link: 'https://whatsapp.com',
    isAuthorized: true,
    orderIndex: 3
  }
];

export const NAV_LINKS = [
  { label: 'Vitrine', path: '/#vitrine' },
  { label: 'Sobre Nós', path: '/sobre-nos' },
  { label: 'Anuncie Aqui', path: '/#anuncie' },
  { label: 'Seja Parceiro', path: '/#parceria' },
  { label: 'Contato', path: '/#contato' },
  { label: 'Gerenciar', path: '/admin' },
  { label: 'Admin Mensagens', path: '/admin-mensagens' }
];
