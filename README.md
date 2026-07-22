# Calculadora de IMC por idade

Aplicação estática de triagem nutricional que calcula o IMC no navegador e seleciona a referência conforme a idade exata em meses completos.

**Versão online:** [calculadora-imc-saude.spiritstonesrafa.chatgpt.site](https://calculadora-imc-saude.spiritstonesrafa.chatgpt.site)

## Funcionalidades

- cálculo de IMC para crianças, adolescentes, adultos e idosos;
- classificação infantil e adolescente por sexo e idade exata, usando escore-z;
- referências OMS 2006, OMS 2007 e pontos de corte do SISVAN;
- validação dos campos com mensagens claras para correção;
- resultado detalhado e adaptável a celulares e computadores;
- funcionamento local, sem transmitir ou armazenar dados pessoais.

## Como executar

O projeto usa apenas HTML, CSS e JavaScript, sem dependências externas. Como os arquivos JavaScript usam módulos, execute-o por um servidor HTTP local. Por exemplo:

```sh
npx serve .
```

Depois, abra o endereço informado no terminal. Para gerar a versão pronta para publicação:

```sh
npm run build
```

Os arquivos finais serão criados na pasta `dist/`.

## Referências e regras

- **0 a 60 meses:** WHO Child Growth Standards, IMC-para-idade, **OMS 2006**.
- **61 a 228 meses:** WHO Growth Reference, IMC-para-idade, **OMS 2007**.
- **229 a 239 meses:** parâmetros oficiais de 228 meses mantidos conforme orientação operacional do SISVAN.
- **20 a 59 anos:** pontos de corte de adultos do Ministério da Saúde/SISVAN.
- **60 anos ou mais:** pontos de corte específicos de idosos do Ministério da Saúde/SISVAN.

## Dados LMS incorporados

O arquivo `growth-data.js` contém somente os parâmetros `[mês, L, M, S]` das tabelas oficiais de IMC-para-idade, separados por sexo e referência:

- OMS 2006, meninas e meninos, meses 0–60. Meses 0–23 usam a curva baseada em comprimento; meses 24–60 usam a curva baseada em altura.
- OMS 2007, meninas e meninos, meses 61–228.

Origem e versão das tabelas:

- [OMS — BMI-for-age, WHO Child Growth Standards 2006](https://www.who.int/tools/child-growth-standards/standards/body-mass-index-for-age-bmi-for-age), tabelas oficiais de escores-z por sexo, consultadas em 22/07/2026.
- [OMS — BMI-for-age, Growth Reference 2007](https://www.who.int/tools/growth-reference-data-for-5to19-years/indicators/bmi-for-age), tabelas oficiais de escores-z por sexo, consultadas em 22/07/2026.
- [OMS — método de cálculo de percentis e escores-z](https://cdn.who.int/media/docs/default-source/child-growth/growth-reference-5-19-years/computation.pdf), incluindo extensão linear além de ±3 DP.

O cálculo usa a fórmula LMS oficial. Fora do intervalo de -3 a +3, aplica a extensão linear da OMS baseada na distância entre 2 e 3 DP, sem extrapolação improvisada.

Outras fontes:

- [Ministério da Saúde — Orientações para coleta e análise de dados antropométricos/SISVAN](https://www.gov.br/saude/pt-br/composicao/saps/vigilancia-alimentar-e-nutricional/arquivos/orientacoes-para-a-coleta-e-analise-de-dados-antropometricos-em-servicos-de-saude)
- [Ministério da Saúde — notas técnicas do SISVAN para idosos](https://tabnet.datasus.gov.br/cgi/SISVAN/CNV/notas_sisvan.html)

## Privacidade

Todos os cálculos são locais. A aplicação não usa APIs externas, análise de uso, armazenamento local, cookies de aplicação ou envio de formulários. Nome, nascimento, peso, altura e resultados existem somente na memória da página enquanto ela está aberta.

## Testes e build

```sh
npm test
npm run build
```

Os testes cobrem transições etárias, limites adultos e de idosos, tabelas distintas por sexo, parâmetros de 228 meses para 19 anos incompletos, escores-z nos limites e casos documentados pela OMS.

Atualmente, a suíte contém **20 testes automatizados**.

## Estrutura principal

- `index.html`: formulário e apresentação dos resultados;
- `style.css`: aparência e adaptação para diferentes telas;
- `script.js`: validação, interação e cálculo principal;
- `growth-data.js`: parâmetros LMS oficiais da OMS;
- `who-growth.js`: cálculo de escore-z e classificações por idade;
- `test.mjs`: testes automatizados;
- `build.mjs`: geração da pasta de publicação.

## Aviso

O resultado é uma triagem informativa e não constitui diagnóstico. Gestação, prematuridade, condições clínicas e composição corporal requerem avaliação individual por profissional de saúde.
