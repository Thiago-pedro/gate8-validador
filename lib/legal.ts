export type LegalDocId = 'privacy' | 'terms';

type LegalSection = {
  heading: string;
  body?: string;
  bullets?: string[];
};

export type LegalDoc = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export const LEGAL_DOCS: Record<LegalDocId, LegalDoc> = {
  privacy: {
    title: 'Política de privacidade',
    updated: '01/06/2026',
    intro:
      'A Gate8 Tickets respeita sua privacidade e segue a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).',
    sections: [
      {
        heading: '1. Dados coletados',
        bullets: [
          'Token da portaria informado para vincular o aparelho ao evento;',
          'Registros de validação de ingressos (QR e código manual);',
          'Identificação do evento associado à sessão da portaria.',
        ],
      },
      {
        heading: '2. Uso dos dados',
        body: 'Utilizamos esses dados para operar a portaria, validar ingressos, prevenir fraude e cumprir obrigações legais.',
      },
      {
        heading: '3. Compartilhamento',
        body: 'Compartilhamos dados estritamente necessários com o produtor do evento, ferramentas de validação e autoridades, quando exigido por lei.',
      },
      {
        heading: '4. Seus direitos',
        body: 'Você pode solicitar acesso, correção ou exclusão dos seus dados pelo e-mail suporte@gate8.club.',
      },
    ],
  },
  terms: {
    title: 'Termos de uso',
    updated: '01/06/2026',
    intro:
      'Bem-vindo à Gate8 Tickets. Ao acessar e utilizar nossa plataforma, você concorda com os termos descritos abaixo. Caso não concorde, recomendamos não utilizar o serviço.',
    sections: [
      {
        heading: '1. Sobre a plataforma',
        body: 'A Gate8 Tickets atua como intermediadora na venda de ingressos para eventos organizados por terceiros. Não somos responsáveis pela realização, alteração de data, local ou cancelamento dos eventos.',
      },
      {
        heading: '2. App de portaria',
        body: 'O app de portaria valida somente ingressos do evento vinculado ao token informado. O uso do token é de responsabilidade de quem opera a entrada.',
      },
      {
        heading: '3. Cadastro e segurança',
        body: 'Quem usa a portaria é responsável por manter o token em sigilo. Toda a comunicação com a plataforma ocorre por meio de conexão criptografada (SSL/TLS).',
      },
      {
        heading: '4. Responsabilidades',
        body: 'O usuário concorda em utilizar a plataforma de boa-fé, não tentando burlar mecanismos de segurança, validação ou anti-fraude.',
      },
    ],
  },
};
