# Calculadora de IMC

Uma calculadora de Índice de Massa Corporal (IMC) simples, responsiva e acessível. O usuário informa nome, idade, peso e altura para receber o valor do IMC, sua classificação e uma orientação visual da faixa correspondente.

**[Acesse a calculadora online](https://calculadora-imc-saude.spiritstonesrafa.chatgpt.site)**

## Funcionalidades

- Aceita altura em metros (`1,75`) ou centímetros (`175`).
- Aceita vírgula ou ponto nos valores decimais.
- Valida os campos e direciona o foco para o primeiro erro.
- Exibe classificação, mensagem informativa e indicador visual do IMC.
- Adapta o layout para computadores, tablets e celulares.
- Respeita a preferência do sistema por menos animações.
- Não armazena os dados preenchidos.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- Node.js, usado apenas para gerar a versão de distribuição

O projeto não utiliza frameworks nem dependências externas de JavaScript.

## Como executar

Para usar a aplicação localmente, abra o arquivo `index.html` no navegador.

Também é possível iniciar um servidor local. Dentro da pasta do projeto, execute:

```bash
npx serve .
```

Depois, acesse o endereço exibido no terminal.

## Como gerar o build

É necessário ter o Node.js instalado. Execute:

```bash
npm run build
```

O comando recria a pasta `dist/` com os arquivos necessários para publicação. Essa pasta é gerada automaticamente e, por isso, não deve ser versionada.

## Como o cálculo funciona

O IMC é calculado dividindo o peso, em quilogramas, pela altura, em metros, elevada ao quadrado:

```text
IMC = peso / (altura × altura)
```

Exemplo para uma pessoa com 70 kg e 1,75 m:

```text
IMC = 70 / (1,75 × 1,75) = 22,86
```

O resultado é comparado com as faixas de referência apresentadas na própria página.

> O IMC é apenas uma referência e não substitui uma avaliação realizada por médico ou nutricionista.

## Estrutura do projeto

```text
.
├── .openai/
│   └── hosting.json  # Configuração da hospedagem
├── .gitignore        # Impede o envio de arquivos gerados e locais
├── README.md         # Documentação do projeto
├── build.mjs         # Gera a versão de distribuição
├── index.html        # Estrutura e conteúdo da página
├── package.json      # Metadados e comando de build
├── script.js         # Validação, cálculo e interação
└── style.css         # Aparência, animações e responsividade
```

## Publicação no GitHub

Antes de enviar, confira os arquivos alterados:

```bash
git status
```

Repositório do projeto: [spiritstonesrafa-ux/Site-de-IMC](https://github.com/spiritstonesrafa-ux/Site-de-IMC)

Para conectar esta pasta ao repositório:

```bash
git remote set-url origin https://github.com/spiritstonesrafa-ux/Site-de-IMC.git
```

Depois, crie o commit e envie:

```bash
git add .
git commit -m "Documenta calculadora de IMC"
git push -u origin main
```

Para publicar como site pelo GitHub Pages, a aplicação pode ser servida diretamente a partir da raiz da branch principal, pois `index.html`, `style.css` e `script.js` já são arquivos estáticos.
