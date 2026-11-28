import type { PagesContent } from './types';

const pages: PagesContent = {
  ui: {
    updated: 'Última atualização: {date}',
    languages: 'Esta página em outros idiomas',
  },

  guide: {
    title: 'Como baixar seus dados do Strava',
    description: 'Guia passo a passo para pedir o arquivo da sua conta do Strava (export_XXXX.zip) pelo computador ou pelo celular e transformá-lo na retrospectiva do seu ano.',
    kicker: 'Guia passo a passo',
    lead: 'O Strava dá de graça uma cópia de toda a sua conta. Pedir leva um minuto; depois é só esperar um e-mail. Veja como fazer, pelo computador ou pelo celular.',
    sections: [
      {
        h: 'O que é esse arquivo',
        body: [
          'É um **.zip com tudo o que você enviou ao Strava**: a lista das suas atividades, o arquivo original de cada uma (o que o seu relógio ou celular gravou), suas fotos e os dados do seu perfil. Qualquer conta pode pedir, inclusive as gratuitas.',
          'Pedir **não apaga nem muda nada**: o Strava só envia uma cópia.',
        ],
      },
      {
        h: 'Peça no Strava',
        body: [
          '1. Abra **strava.com** no navegador, no computador ou no celular, e faça login. O app do Strava não tem essa opção.\n2. Toque na sua foto e vá em **Configurações → Minha conta → Baixar sua conta → Começar**. Ou vá direto por [este link para o Strava](strava).\n3. Toque em **Solicitar download**.',
          'O Strava só permite **um pedido por semana**. Se você pediu há pouco tempo, procure o e-mail que já recebeu.',
        ],
      },
      {
        h: 'Espere o e-mail e guarde o .zip',
        body: [
          'O Strava escreve para o endereço da sua conta com o link de download. Costuma levar alguns minutos; com muitos anos de atividades, algumas horas.',
          'Baixe o arquivo e guarde o **export_XXXXXXXX.zip** como está, sem descompactar.',
          '- **Android:** ele fica na pasta Downloads.\n- **iPhone:** o Safari salva no app Arquivos, em Downloads.\n- **Mac:** o Safari pode descompactar sozinho. Sem problema: depois você escolhe a pasta.',
        ],
      },
      {
        h: 'Envie e veja o seu ano',
        body: [
          'Volte à [página inicial do {brand}](home#crear) e solte o .zip no quadro, ou toque nele para escolher. Em um minuto sua história fica pronta. Se já estiver descompactado, use “Já descompactou? Escolha a pasta”.',
          'O arquivo **não é enviado a nenhum servidor**: ele é lido no seu próprio navegador. Os detalhes estão em [Privacidade e cookies](page:privacy).',
        ],
      },
      {
        h: 'Se algo der errado',
        body: [
          '- **O e-mail não chega.** Olhe na caixa de spam e confira se é o endereço da sua conta do Strava. Com muitas atividades pode levar horas.\n- **“Não encontro activities.csv”.** Esse .zip não é o da sua conta: o certo se chama export_ seguido de um número.\n- **O arquivo tem vários GB.** Não importa: só as partes necessárias são lidas.\n- **Não aparecem corridas ou sai outro ano.** Abra “Personalizar” e confira o ano e quais tipos de atividade contam como corrida.',
          'Ainda não funciona? Escreva para [{email}](mail).',
        ],
      },
    ],
  },

  how: {
    title: 'Como sua retrospectiva é calculada',
    description: 'De onde vem cada número do seu ano correndo: distância, melhores marcas, mapa de calor, países, frequência cardíaca, perfil de corredor… e por que algumas telas não aparecem.',
    kicker: 'Em detalhes',
    lead: 'Todos os números vêm do arquivo da sua conta do Strava e são calculados no seu navegador. Veja como, tela por tela.',
    sections: [
      {
        h: 'De onde vêm os dados',
        body: [
          'Duas coisas são lidas do arquivo: **activities.csv**, a lista de todas as suas atividades com distância, tempo, elevação e tênis; e **o arquivo original de cada corrida** (FIT, GPX ou TCX), com GPS e frequência cardíaca segundo a segundo. Tanto faz correr com Garmin, Coros, Apple Watch ou o celular.',
          'Só são abertas as corridas do ano escolhido, então funciona também com arquivos de vários GB.',
        ],
      },
      {
        h: 'O que conta como corrida',
        body: [
          'Por padrão, as atividades do tipo corrida, corrida em trilha e corrida virtual. Em “Personalizar” você pode adicionar ou tirar tipos: as caminhadas, por exemplo.',
          'Atividades mais rápidas que o recorde mundial da sua distância são descartadas: quase sempre são um pedal ou um trajeto de carro salvos como corrida.',
        ],
      },
      {
        h: 'Distância, tempo e elevação',
        body: [
          'São os mesmos valores que você vê no Strava. O tempo é o **tempo em movimento**, sem as pausas.',
          'Se o ano ainda não acabou, a comparação com o anterior usa as mesmas datas: onde você estava “a esta altura”.',
        ],
      },
      {
        h: 'Melhores marcas',
        body: [
          'Para cada distância (1 km ou 1 milha, 5 km, 10 km, meia maratona e maratona) procuramos **o trecho mais rápido dentro de qualquer uma das suas corridas**, pelo GPS. Não precisa ter sido uma prova: seus melhores 5 km podem estar no meio de um longão.',
        ],
      },
      {
        h: 'Mapas, cidades e países',
        body: [
          'O site traz seu próprio mapa do mundo e sua lista de cidades, então **suas coordenadas não são enviadas a nenhum serviço de mapas**. Sua cidade é a região onde começam mais corridas.',
          'Para não mostrar onde você mora, cada percurso é desenhado **sem os primeiros e os últimos 250 metros** e sem os trechos dentro das suas zonas de privacidade do Strava. Você pode desativar isso em “Personalizar”, e também esconder o mapa da sua cidade.',
        ],
      },
      {
        h: 'Horários e hábitos',
        body: [
          'A hora de cada corrida é a **hora local do lugar onde você correu**, mesmo em viagem. Para saber se você corre na hora dourada, ao nascer do sol ou à noite, calculamos a posição real do sol naquele dia e lugar.',
        ],
      },
      {
        h: 'Frequência cardíaca',
        body: [
          'Os batimentos são estimados pela frequência média e pela duração de cada corrida. As cinco zonas partem da sua frequência máxima do ano: menos de 60%, 60–70%, 70–80%, 80–90% e mais de 90%.',
        ],
      },
      {
        h: 'Tênis',
        body: [
          'Os quilômetros de cada par são os das corridas em que você o marcou no Strava. A barra de vida útil conta também os anos anteriores e usa como referência cerca de 800 km (500 milhas).',
        ],
      },
      {
        h: 'Seu perfil de corredor',
        body: [
          'É um de dez perfis: madrugador, noturno, viajante, de montanha, fundista, veloz, constante, de fim de semana, de esteira ou versátil. Ele é escolhido pelo que mais diferencia você: seus horários, a elevação, a distância média, o ritmo, as semanas em que você sai ou os lugares onde corre.',
        ],
      },
      {
        h: 'Por que falta alguma tela',
        body: [
          'Cada tela precisa de um mínimo de dados para dizer algo que faça sentido. Se você não chega lá, ela não aparece. Alguns exemplos:',
          '- **Calendário:** 10 dias correndo.\n- **Elevação:** 300 m acumulados.\n- **Melhores marcas:** pelo menos duas distâncias com GPS.\n- **Mapa da sua cidade:** 5 percursos na mesma região.\n- **Onde você correu:** mais de uma cidade ou país.\n- **Tênis:** um par com 50 km, marcado em boa parte das suas corridas.\n- **Outros esportes:** pelo menos mais dois esportes praticados com alguma frequência.\n- **Frequência cardíaca:** corridas gravadas com monitor cardíaco.',
        ],
      },
      {
        h: 'Imagens e vídeo',
        body: [
          'Cada tela é salva em 1080 × 1920, o tamanho de um story do Instagram. O vídeo também é criado no seu navegador; se o seu não conseguir, você sempre tem a imagem.',
        ],
      },
      {
        h: 'Se algo parecer estranho',
        body: [
          'Os números dependem do que o seu relógio gravou: um GPS com saltos ou uma atividade com o tipo errado podem mudar um resultado. Se algo não bater, conte para a gente em [{email}](mail).',
        ],
      },
    ],
  },

  about: {
    title: 'Sobre o {brand}',
    description: 'O que é o {brand}, quem faz, como se mantém e como entrar em contato.',
    kicker: 'O projeto',
    lead: 'O {brand} transforma o arquivo da sua conta do Strava em uma história do seu ano correndo, pronta para compartilhar. É grátis, não pede cadastro e seus dados não saem do seu dispositivo.',
    sections: [
      {
        h: 'Quem está por trás',
        body: [
          'O {brand} é um projeto independente criado por {owner}, na Espanha. Não pertence ao Strava nem tem relação com ele: é compatível com o Strava porque lê o arquivo que o Strava deixa qualquer usuário baixar.',
        ],
      },
      {
        h: 'Como se mantém',
        body: [
          { when: 'noads', text: 'O site é gratuito e no momento não tem publicidade. Mais adiante poderá mostrar anúncios para cobrir seus custos, sempre fora da sua história e das suas imagens, e pedindo sua permissão antes de usar cookies.' },
          { when: 'ads', text: 'O site é gratuito e se mantém com publicidade. Os anúncios aparecem só na página inicial, abaixo dos seus resultados e nas páginas de texto: nunca dentro da sua história nem nas imagens que você compartilha.' },
        ],
      },
      {
        h: 'Contato',
        body: ['Para dúvidas, erros ou sugestões, escreva para [{email}](mail).'],
      },
      {
        h: 'Créditos',
        body: [
          'Os mapas usam dados do Natural Earth e a lista de cidades é do GeoNames (CC BY 4.0). As fontes são Anton, Archivo, Oswald e Noto Sans. Aqui estão as [licenças do software e dos dados que o site usa](licenses).',
          'Strava é uma marca registrada da Strava, Inc. O {brand} não é afiliado, patrocinado nem endossado pela Strava, Inc.',
        ],
      },
    ],
  },

  legal: {
    title: 'Aviso legal e termos de uso',
    description: 'Quem é o titular do {brand}, os termos de uso do site, a propriedade intelectual e a lei aplicável.',
    kicker: 'Legal',
    lead: 'Quem é o titular deste site e em que condições ele pode ser usado.',
    sections: [
      {
        h: 'Titular do site',
        body: [
          'Em cumprimento do artigo 10 da lei espanhola 34/2002, de serviços da sociedade da informação e de comércio eletrônico:',
          '- **Titular:** {owner}',
          { when: 'nif', text: '- **Número fiscal (NIF):** {nif}' },
          { when: 'address', text: '- **Endereço:** {address}' },
          '- **E-mail:** [{email}](mail)\n- **Site:** {domain}',
        ],
      },
      {
        h: 'O que é o {brand}',
        body: [
          'Uma ferramenta gratuita que gera uma retrospectiva anual de corrida a partir do arquivo de dados que cada pessoa baixa da sua própria conta do Strava. Todo o cálculo é feito no navegador de quem usa.',
        ],
      },
      {
        h: 'Relação com o Strava',
        body: [
          'O {brand} é um projeto independente. Não é afiliado, patrocinado nem endossado pela Strava, Inc., e não usa a API dela. Strava é uma marca registrada da Strava, Inc.; é mencionada apenas para indicar a compatibilidade com o arquivo de dados que o Strava entrega aos seus usuários.',
        ],
      },
      {
        h: 'Termos de uso',
        body: [
          '- O site é para uso pessoal. Use apenas o arquivo da sua própria conta, ou o de outra pessoa com a permissão dela.\n- Não use para fins ilícitos nem de forma que possa danificá-lo ou impedir o uso por outras pessoas.\n- Os números são calculados automaticamente com os dados do seu arquivo e são indicativos: podem conter erros se os dados de origem tiverem erros.\n- O site é oferecido como está, sem garantia de disponibilidade, e pode mudar ou deixar de estar disponível.',
        ],
      },
      {
        h: 'Propriedade intelectual',
        body: [
          'O design, o código e os textos do {brand} pertencem ao seu titular. Não é permitido copiá-los nem reutilizá-los sem autorização.',
          '**As imagens e os vídeos que você gera com seus dados são seus**: você pode baixá-los e compartilhá-los livremente.',
          'O software e os dados de terceiros usados pelo site mantêm suas próprias [licenças](licenses).',
        ],
      },
      {
        when: 'ads',
        h: 'Publicidade',
        body: [
          'O site é financiado por publicidade veiculada pelo Google AdSense, identificada como tal. O titular não escolhe os anúncios exibidos nem responde pelos produtos ou serviços anunciados.',
        ],
      },
      {
        h: 'Responsabilidade',
        body: [
          'O titular não responde por danos decorrentes do uso indevido do site nem pelo conteúdo de sites externos para os quais há links. Se você notar um conteúdo ou link inadequado, escreva para [{email}](mail).',
        ],
      },
      {
        h: 'Lei aplicável',
        body: [
          'Estes termos são regidos pela legislação espanhola. Se você é consumidor, qualquer conflito será resolvido nos tribunais do seu domicílio.',
        ],
      },
    ],
  },

  privacy: {
    title: 'Privacidade e cookies',
    description: 'Quais dados o {brand} trata e quais não: seu arquivo do Strava não sai do seu dispositivo. Cookies, estatísticas, publicidade e seus direitos.',
    kicker: 'Legal',
    lead: 'O essencial: **seu arquivo do Strava não sai do seu dispositivo**. Não há contas nem cadastro, e não recebemos suas atividades, seus percursos nem suas fotos.',
    sections: [
      {
        h: 'Quem é o responsável',
        body: [
          '{owner}, titular do {brand}. Para qualquer questão sobre seus dados, escreva para [{email}](mail). Os dados completos estão no [aviso legal](page:legal).',
        ],
      },
      {
        h: 'Seu arquivo do Strava',
        body: [
          'Quando você escolhe seu arquivo, **ele é lido e processado no seu próprio navegador**. Não é enviado a nenhum servidor: não o recebemos, não o guardamos e não podemos vê-lo. O mesmo vale para seu nome, seus percursos e suas fotos.',
          'Tudo fica na memória da aba e desaparece quando você a fecha ou recarrega. As imagens e os vídeos são criados no seu dispositivo, e só saem dele se você compartilhar.',
        ],
      },
      {
        h: 'Dados técnicos da visita',
        body: [
          'Como em qualquer site, para enviar as páginas o nosso provedor de hospedagem, a **Cloudflare**, trata seu endereço IP e dados técnicos da conexão (navegador, data e hora, página pedida). Ela os usa para servir o site e protegê-lo de ataques. A base legal é o nosso interesse legítimo em oferecer o site com segurança (art. 6.1.f do RGPD).',
          'A Cloudflare atua como operadora do tratamento. Pode tratar dados fora do Espaço Econômico Europeu com as garantias do Marco de Privacidade de Dados UE-EUA e das cláusulas contratuais padrão.',
        ],
      },
      {
        h: 'Estatísticas de visitas',
        body: [
          'Medimos as visitas com o **Cloudflare Web Analytics**: páginas vistas, país aproximado e tipo de dispositivo, sempre de forma agregada. Ele não usa cookies, não guarda nada no seu dispositivo, não identifica você nem segue você em outros sites.',
        ],
      },
      {
        id: 'cookies',
        h: 'Cookies e armazenamento no seu navegador',
        body: [
          'O {brand} não instala cookies próprios. Ele só guarda no seu navegador **o idioma que você escolhe** (chave “myrunyear.lang” do armazenamento local), para lembrar na próxima visita. É um ajuste que você mesmo pede, por isso não precisa de consentimento, e você pode apagá-lo nas configurações do navegador.',
          { when: 'noads', text: 'No momento o site **não mostra publicidade nem usa cookies de terceiros**. Se isso mudar, vamos pedir sua permissão antes e atualizar esta página.' },
          { when: 'ads', text: 'Já a publicidade do **Google AdSense** usa cookies e identificadores, do Google e de seus parceiros, para mostrar e medir os anúncios e, se você aceitar, personalizá-los. Antes de usá-los pedimos sua permissão em um aviso no qual você pode **aceitar, recusar ou configurar** com a mesma facilidade.' },
          { when: 'ads', text: 'Você pode mudar sua escolha quando quiser em “Preferências de privacidade”, no rodapé de qualquer página. Se recusar, o site funciona do mesmo jeito e os anúncios não são personalizados.' },
          { when: 'ads', text: '- **Quem usa:** a Google Ireland Limited e os parceiros de publicidade listados no aviso.\n- **Para quê:** mostrar anúncios, limitar quantas vezes você vê o mesmo, medir resultados, evitar fraudes e, com sua permissão, personalizá-los.\n- **Quanto duram:** da sessão até 13 meses, conforme o cookie.\n- **Mais informações:** [como o Google usa os dados de sites que mostram seus anúncios](https://policies.google.com/technologies/partner-sites).' },
        ],
      },
      {
        when: 'ads',
        h: 'Publicidade',
        body: [
          'A base legal da publicidade personalizada e de seus cookies é o seu consentimento (art. 6.1.a do RGPD), que você pode retirar a qualquer momento. O Google trata esses dados como controlador independente: consulte a [política de privacidade](https://policies.google.com/privacy) dele.',
        ],
      },
      {
        h: 'Se você nos escrever',
        body: ['Usaremos seu endereço e sua mensagem apenas para responder, e os apagaremos quando não forem mais necessários.'],
      },
      {
        h: 'Seus direitos',
        body: [
          'Você pode pedir o acesso, a correção ou a exclusão dos seus dados, opor-se ao tratamento ou pedir que ele seja limitado, escrevendo para [{email}](mail). Lembre que não temos seus dados do Strava: eles nunca chegam até nós.',
          'Se achar que não atendemos bem ao seu pedido, você pode reclamar à Agência Espanhola de Proteção de Dados ([aepd.es](https://www.aepd.es)).',
        ],
      },
      {
        h: 'Menores',
        body: ['O site não é destinado a menores de 14 anos.'],
      },
      {
        h: 'Mudanças nesta política',
        body: ['Se esta política mudar, publicaremos aqui a nova versão com a data.'],
      },
    ],
  },
};

export default pages;
