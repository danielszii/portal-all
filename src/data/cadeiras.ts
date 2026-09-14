export type Obra = { titulo: string; ano?: string; tipo?: string }

export type Sucessor = { nome: string; periodo: string; status: 'Titular' | 'In memoriam' | 'Emérito' }

export type ProducaoLiteraria = { titulo: string; tipo: 'Poema' | 'Crônica' | 'Conto' | 'Artigo'; texto: string }

export type Cadeira = {
  number: string
  patron: string
  founder: string
  holder: string
  image: string
  status: string
  bio?: string
  bioExtra?: string
  posse?: string
  obras?: Obra[]
  patronoBio?: string
  sucessao?: Sucessor[]
  producao?: ProducaoLiteraria[]
}

export const cadeiras: Cadeira[] = [
  {
    number: 'I',
    patron: 'José de Alencar',
    founder: 'Pe. Manuel de Castro',
    holder: 'Maria do Socorro Azevedo',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=700&q=80',
    status: 'Titular em exercício',
    posse: '2004',
    bio: 'Escritora e pesquisadora, autora de obras sobre a cultura sertaneja do Ceará. Membro efetivo da Academia Limoeirense de Letras desde 2004, onde ocupa a cadeira de número I, que tem como patrono José de Alencar.',
    bioExtra: 'Colaboradora de periódicos culturais da região, Maria do Socorro Azevedo é reconhecida por sua dedicação à preservação da memória literária do Vale do Jaguaribe.',
    obras: [
      { titulo: 'Vozes do Sertão', ano: '2008', tipo: 'Poesia' },
      { titulo: 'Crônicas do Vale', ano: '2015', tipo: 'Crônica' },
      { titulo: 'Memória e Identidade no Jaguaribe', ano: '2021', tipo: 'Ensaio' },
    ],
    patronoBio: 'José de Alencar (1829–1877), natural de Mecejana, Ceará, foi romancista, teatrólogo e político brasileiro. Considerado um dos maiores escritores do Romantismo, é autor de obras como "O Guarani", "Iracema" e "Senhora".',
    sucessao: [
      { nome: 'Pe. Manuel de Castro', periodo: '1998–2003', status: 'Titular' },
      { nome: 'Maria do Socorro Azevedo', periodo: '2004–presente', status: 'Titular' },
    ],
    producao: [
      {
        titulo: 'A tarde do sertão',
        tipo: 'Poema',
        texto: 'A tarde desce devagar\nsobre a pedra e o juazeiro,\ncomo quem não quer esquecer\no verde do açudeiro.\n\nO vento que vem do norte\ntraz recados do passado,\nde quando a palavra era forte\ne o verso ainda não havia sido dado.\n\nFica, tarde. Fica, luz.\nFaz da sombra teu vestido.\nNesta terra que produz\nbelleza do que foi vivido.',
      },
    ],
  },
  {
    number: 'II',
    patron: 'Aluísio Azevedo',
    founder: 'Francisca das Chagas',
    holder: 'Ednaldo Bezerra',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=80',
    status: 'Titular em exercício',
    posse: '2006',
    bio: 'Jornalista e poeta, colaborador de periódicos literários do Nordeste. Ocupa a cadeira II da Academia Limoeirense de Letras desde 2006, dedicando-se à poesia de temática social e à crítica literária.',
    obras: [
      { titulo: 'Letras do Nordeste', ano: '2010', tipo: 'Poesia' },
      { titulo: 'Cenas do Cotidiano', ano: '2018', tipo: 'Crônica' },
    ],
    patronoBio: 'Aluísio Azevedo (1857–1913), maranhense, foi o principal representante do Naturalismo na literatura brasileira. Autor de "O Cortiço" e "O Mulato", obras que retratam com realismo as contradições sociais do Brasil do século XIX.',
    sucessao: [
      { nome: 'Francisca das Chagas', periodo: '1998–2005', status: 'In memoriam' },
      { nome: 'Ednaldo Bezerra', periodo: '2006–presente', status: 'Titular' },
    ],
    producao: [
      {
        titulo: 'Nordeste que eu carrego',
        tipo: 'Crônica',
        texto: 'Toda vez que o inverno falha, o sertanejo olha o céu como quem lê um livro antigo, procurando no azul a promessa que o pai do pai já procurava. Não é superstição — é memória. É o arquivo mais vivo que existe: o corpo do homem que aprendeu a sobreviver sem chuva.\n\nEscrever sobre o Nordeste é sempre escrever sobre a espera. E a espera, aqui, tem um ritmo próprio — lento como a caatinga no verão, súbito como o primeiro trovão de dezembro.',
      },
    ],
  },
  {
    number: 'III',
    patron: 'Antônio Sales',
    founder: 'José Moreira Lima',
    holder: 'Francisca Alves',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=700&q=80',
    status: 'Titular em exercício',
    posse: '2009',
    bio: 'Professora e ensaísta, com pesquisas sobre literatura de cordel e cultura popular nordestina. Autora de trabalhos acadêmicos publicados em revistas especializadas de todo o Brasil.',
    obras: [
      { titulo: 'O Cordel e a Identidade', ano: '2013', tipo: 'Ensaio' },
      { titulo: 'Cantos do Povo', ano: '2019', tipo: 'Antologia organizada' },
    ],
    patronoBio: 'Antônio Sales (1868–1940), cearense de Icó, foi poeta, contista e jornalista. Fundador da Academia Cearense de Letras, destacou-se pelo estilo refinado e pela contribuição ao Parnasianismo no Brasil.',
  },
  {
    number: 'IV',
    patron: 'Rachel de Queiroz',
    founder: 'Francisco Holanda',
    holder: 'Raimundo Nonato de Oliveira',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=700&q=80',
    status: 'Titular em exercício',
    posse: '2005',
    bio: 'Advogado e romancista, vencedor do Prêmio de Literatura Cearense em 2018. Sua obra ficcional aborda temas como memória, identidade e o cotidiano do interior cearense.',
    obras: [
      { titulo: 'A Pedra e a Água', ano: '2012', tipo: 'Romance' },
      { titulo: 'Nas Margens do Jaguaribe', ano: '2018', tipo: 'Romance' },
      { titulo: 'Contos do Sertão Úmido', ano: '2022', tipo: 'Conto' },
    ],
    patronoBio: 'Rachel de Queiroz (1910–2003), cearense de Fortaleza, foi a primeira mulher a ocupar uma cadeira na Academia Brasileira de Letras. Autora de "O Quinze", obra que a consagrou aos 20 anos, e de "As Três Marias", entre outros clássicos.',
  },
  {
    number: 'V',
    patron: 'Gustavo Barroso',
    founder: 'Maria Goreti',
    holder: 'Vaga',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=700&q=80',
    status: 'Vaga',
    patronoBio: 'Gustavo Barroso (1888–1959), natural de Fortaleza, foi escritor, jornalista, folclorista e museólogo. Fundador e presidente do Museu Histórico Nacional, é autor de "Terra do Sol" e de vasta obra sobre a história e o folclore brasileiro.',
  },
  {
    number: 'VI',
    patron: 'Juvenal Galeno',
    founder: 'Antônio Freitas',
    holder: 'Carlos Eduardo Lima',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=700&q=80',
    status: 'Titular em exercício',
    posse: '2010',
    bio: 'Compositor e escritor, membro da Academia há mais de quinze anos. Suas composições musicais têm letra de forte caráter literário, e sua prosa lírica é reconhecida nos meios culturais do Ceará.',
    obras: [
      { titulo: 'Canções da Terra', ano: '2011', tipo: 'Poesia/Música' },
      { titulo: 'Prosa do Vento', ano: '2020', tipo: 'Crônica' },
    ],
    patronoBio: 'Juvenal Galeno (1836–1931), cearense de Fortaleza, foi poeta e folclorista. Considerado o poeta popular mais importante do Ceará no século XIX, destacou-se por recolher e celebrar as tradições orais do povo cearense.',
  },
  {
    number: 'VII',
    patron: 'Cecília Meireles',
    founder: 'Maria Ivone de Sousa',
    holder: 'Ana Maria de Lima',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80',
    status: 'Titular em exercício',
    posse: '2007',
    bio: 'Poeta e educadora, autora de três coletâneas de poesia premiadas. Vice-presidente da Academia Limoeirense de Letras na gestão 2022–2026, Ana Maria de Lima é referência na poesia lírica do Vale do Jaguaribe.',
    obras: [
      { titulo: 'Água Viva', ano: '2009', tipo: 'Poesia' },
      { titulo: 'Silêncio entre Versos', ano: '2014', tipo: 'Poesia' },
      { titulo: 'Jardim de Inverno', ano: '2023', tipo: 'Poesia' },
    ],
    patronoBio: 'Cecília Meireles (1901–1964), carioca, foi uma das maiores poetisas da literatura brasileira. Sua obra, marcada pelo lirismo e pela reflexão sobre o tempo e a morte, inclui "Romanceiro da Inconfidência" e "Ou Isto ou Aquilo".',
  },
  {
    number: 'VIII',
    patron: 'Drummond de Andrade',
    founder: 'Raimundo Façanha',
    holder: 'Sebastião Neto',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=80',
    status: 'Titular em exercício',
    posse: '2003',
    bio: 'Historiador e cronista, pesquisador da memória oral do Vale do Jaguaribe. Autor de obras que reconstituem a história cultural da região, Sebastião Neto é um dos membros mais antigos da Academia em exercício.',
    obras: [
      { titulo: 'Histórias do Jaguaribe', ano: '2007', tipo: 'História' },
      { titulo: 'Crônicas de Limoeiro', ano: '2016', tipo: 'Crônica' },
    ],
    patronoBio: 'Carlos Drummond de Andrade (1902–1987), mineiro de Itabira, é considerado o maior poeta brasileiro do século XX. Sua obra, marcada pela ironia, pelo lirismo e pela consciência social, inclui "Alguma Poesia" e "A Rosa do Povo".',
    sucessao: [
      { nome: 'Raimundo Façanha', periodo: '1998–2002', status: 'In memoriam' },
      { nome: 'Sebastião Neto', periodo: '2003–presente', status: 'Titular' },
    ],
    producao: [
      {
        titulo: 'Limoeiro em três tempos',
        tipo: 'Crônica',
        texto: 'A cidade que conheci criança cabia inteira numa tarde. O mercado, a praça, a cadeia e a igreja — tudo se alcançava a pé, e cada esquina tinha uma história que alguém guardava na memória como se fosse própria.\n\nDepois vieram os anos e as demolições. Mas a memória, essa, não aceita pá de obra. Fica grudada nas pedras mesmo quando as pedras vão abaixo. É o que me faz continuar escrevendo: a certeza de que guardar é também uma forma de construir.',
      },
    ],
  },
  {
    number: 'XII',
    patron: 'Patativa do Assaré',
    founder: 'José Airton de Freitas',
    holder: 'Francisco de Assis Silva',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=80',
    status: 'In memoriam',
    bio: 'Francisco de Assis Silva foi poeta e professor, dedicando sua vida à valorização da literatura de cordel e da cultura popular cearense. Seu legado é preservado pela Academia como referência da memória literária regional.',
    obras: [
      { titulo: 'Cantadores do Nordeste', ano: '1998', tipo: 'Pesquisa/Poesia' },
      { titulo: 'O Boi e a Lua', ano: '2002', tipo: 'Cordel' },
    ],
    patronoBio: 'Patativa do Assaré (1909–2002), natural de Assaré, Ceará, foi o maior poeta popular do Brasil. Autodidata e cego de um olho, sua obra em verso celebra o homem nordestino, a seca e a resistência do povo sertanejo.',
  },
]
