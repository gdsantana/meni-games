# Meni Games

Jogos leves para uma pausa no dia. Aplicação mobile-first em português brasileiro, com identidade branca e rosa-bebê. O MVP inclui Sudoku completo; caça-palavras, memória e campo minado aparecem apenas no catálogo como próximos jogos.

## Executar

Use Node.js 22+ e pnpm 11.

```sh
pnpm install
pnpm dev       # http://localhost:3000
pnpm build     # produção
pnpm start     # servir produção
pnpm lint      # análise estática
pnpm exec tsc --noEmit
```

## Stack e arquitetura

Next.js App Router (Webpack), React, TypeScript strict, Tailwind CSS 4, componentes shadcn/ui sobre Radix, Lucide e Nunito Sans. Sem backend, contas ou banco de dados.

- `src/app`: rotas e layout; a home é um Server Component.
- `src/lib/games`: catálogo tipado com nomes, descrições, ícones, rotas e disponibilidade.
- `src/styles/tokens.css`: tokens semânticos de cores e tipografia.
- `src/components/ui`: botão e diálogo acessível compartilhados.
- `src/features/sudoku/engine`: geração, resolução, avaliação lógica e validação, independentes de React.
- `src/features/sudoku/state`: reducer e histórico de ações.
- `src/features/sudoku/storage`: armazenamento versionado e validação de dados.
- `src/features/sudoku/hooks`: integração do estado, relógio e persistência.
- `src/features/sudoku/components`: tabuleiro, controles e experiência de jogo.

## Geração procedural e dificuldade

Cada partida nasce de uma grade completa criada por backtracking com ordem aleatória de candidatos. O gerador embaralha as posições das pistas e tenta removê-las uma a uma. Uma busca com máscaras de bits e escolha da célula com menos candidatos conta soluções, interrompendo na segunda: apenas remoções que preservam **exatamente uma solução** são aceitas.

O número de pistas orienta a busca, mas **não define a dificuldade**. Um avaliador resolve o candidato com técnicas em ordem crescente e classifica pela técnica mais complexa necessária:

- **Fácil:** singles nus e ocultos.
- **Médio:** requer exclusões por candidatos bloqueados ou pares nus, além dos singles.
- **Difícil:** requer X-Wing ou dedução por contradição de candidatos que não permitem nenhuma conclusão válida.

A contradição usa uma busca exaustiva para provar que um candidato é impossível; não é uma tentativa aleatória do jogador. A classificação expressa a complexidade deste avaliador, não uma escala universal de dificuldade humana. Só são entregues grades que o avaliador resolve e classifica no nível solicitado. Nenhuma coleção de tabuleiros é utilizada; a pequena ilustração da home é apenas decorativa.

Os comandos usam Webpack para empacotar o Web Worker como JavaScript executável; o bundle do Turbopack desta versão emitia o arquivo TypeScript sem compilação.

Há um limite de 60 candidatos por pedido e de passos no avaliador. A interface usa Web Worker, mostra carregamento e oferece nova tentativa em caso de falha, sem substituir a partida anterior. Um limite adicional de 45 segundos encerra o worker em dispositivos muito lentos. Não há fallback para um tabuleiro fixo nem para outro nível. Identificador, solução e distribuição de pistas são novos a cada geração.

## Jogabilidade

Selecione uma célula e use o teclado numérico. As pistas originais são protegidas. Linhas, colunas, blocos, números iguais, seleção e conflitos recebem destaques distintos. O destaque de conflitos pode ser desativado nas configurações.

Anotações registram candidatos no formato 3×3. Preenchimentos, anotações, apagamentos e dicas podem ser desfeitos e refeitos, com até 200 ações no histórico. A dica preenche uma célula vazia ou corrige uma entrada com o número da solução única. Reiniciar mantém as pistas; novo jogo gera outro desafio. Ambos pedem confirmação antes de substituir progresso inacabado.

Setas navegam entre casas, 1–9 preenchem, Backspace/Delete apagam. Tab alcança controles e Escape fecha diálogos compatíveis. Atalhos do navegador com modificadores são preservados. O diálogo de vitória só aparece quando a grade corresponde à solução, nunca apenas por estar cheia.

A exibição do tempo vem desativada por padrão e pode ser habilitada em **Configurações → Exibir tempo**. A preferência é salva neste navegador; a contagem continua em segundo plano quando o tempo está oculto.

O relógio usa tempo monotônico, em vez de contar intervalos, para evitar drift. Pausa explícita, aba oculta e conclusão interrompem a contagem. Ao retornar ao site, a partida aguarda a opção de continuar.

## Persistência

O `localStorage` usa a chave `meni-games:sudoku` com versão 1. Salva identificador, pistas, solução, entradas, notas, dificuldade, tempo acumulado, pausa, status, seleção, modo de notas, preferência de conflitos e históricos. A persistência ocorre após mudanças de estado, inclusive atualizações do relógio.

O carregamento acontece após a montagem para evitar diferenças de hidratação. Dados inválidos são descartados com segurança e versões desconhecidas não são interpretadas como o formato atual. Falhas de acesso ou quota são informadas na interface. Restaurar mantém o tabuleiro original e não aciona o gerador. O progresso fica apenas no navegador e pode ser perdido se seus dados forem apagados.

## Adicionar outro jogo

Inclua metadados em `src/lib/games/registry.ts`, implemente uma rota em `src/app/games/<id>` e mantenha regras/estado em `src/features/<id>`. Marque como disponível somente quando a rota estiver pronta. Não é necessário alterar o motor do Sudoku nem criar um motor universal.

## Verificação e próximos passos

Sem frameworks ou suites de testes automatizados, conforme o escopo. Validação por build de produção, TypeScript, lint e autochecagens temporárias de geração, estado e persistência. O layout usa tabuleiro quadrado, largura fluida, áreas seguras e controles que permitem rolagem natural em telas baixas. A experiência em aparelhos físicos ainda deve ser conferida antes de uma publicação pública.

Roadmap: novos módulos de caça-palavras, memória, campo minado, 2048 e jogo da velha; explicações didáticas das dicas; calibração da dificuldade com jogadores reais.
