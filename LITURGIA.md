# Como atualizar a Liturgia Diária

A aba **Liturgia** (`liturgia.html`) mostra o dia escolhido a partir do arquivo
`liturgia.json`. Cada dia é um bloco, identificado pela data no formato
`AAAA-MM-DD`. Se não houver bloco para o dia, o visitante vê o aviso
"A liturgia deste dia ainda não foi publicada aqui", com um link para o site
da Canção Nova.

## Direitos autorais (leia antes de publicar)

Os textos litúrgicos usados no Brasil (Lecionário, tradução da CNBB e os
conteúdos de outros sites) têm direitos reservados. Só publique aqui textos que
a paróquia tenha **autorização ou licença** para reproduzir, ou textos de
domínio público. Preencha sempre o campo `"fonte"`, que aparece no fim do dia.

## Como adicionar um dia

Abra `liturgia.json` e inclua um bloco dentro de `"dias"`. Separe os dias com
vírgula. Use `\n` para quebrar linha dentro de um texto (no Salmo, uma linha
por verso).

```json
{
  "dias": {
    "2026-11-18": {
      "titulo": "Nome da celebração",
      "grau": "Memória",
      "cor": "Verde",
      "leituras": [
        { "tipo": "Primeira Leitura", "referencia": "Livro 1,1-10", "texto": "Cole aqui o texto." },
        { "tipo": "Salmo", "referencia": "Sl 1", "refrao": "Cole aqui o refrão.", "texto": "Verso 1\nVerso 2" },
        { "tipo": "Evangelho", "referencia": "Lc 1,1-10", "texto": "Cole aqui o texto." }
      ],
      "fonte": "Nome da fonte e da tradução, com a permissão de uso"
    },
    "2026-11-19": { "...": "outro dia" }
  }
}
```

Campos opcionais: `titulo`, `grau`, `cor`, `refrao` e `fonte`. A lista
`leituras` pode ter quantos itens forem necessários (Segunda Leitura, Aleluia
etc.), cada um com `tipo`, `referencia` e `texto`.

## Cuidados

- O JSON é rígido: aspas duplas em tudo, vírgula entre blocos e **sem vírgula
  depois do último item**. Um erro faz a aba mostrar "Não foi possível carregar".
  Valide em um verificador de JSON antes de enviar.
- Aspas dentro de um texto devem vir com barra: `\"`.
- Para testar no computador, abra a pasta com a extensão **Live Server** do
  VS Code. Abrir o `liturgia.html` com duplo clique não carrega o JSON.
- O dia exibido segue o horário de Franca-SP.
- Os textos são inseridos como texto puro; códigos HTML digitados no JSON
  aparecem escritos, sem efeito.
