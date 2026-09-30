# Simulador de Estética Facial

Um simulador visual educacional para explorar, de forma interativa, conceitos de estética facial em uma imagem.

> Projeto demonstrativo: não oferece aconselhamento médico, recomendações de tratamento, orientação sobre injeções ou garantia de resultados clínicos.

## Demonstração

Acesse a versão publicada:

**[Abrir o simulador](https://brenojj-08.github.io/aesthetic-face-simulator/)**

## Funcionalidades

- Seleção de áreas predefinidas: testa, glabela e área dos olhos
- Criação e exclusão de áreas de tratamento
- Reposicionamento das áreas por arrastar e soltar
- Redimensionamento com uma bolinha no canto da área
- Controle de intensidade do efeito visual
- Prévia limpa do resultado, sem elementos de edição
- Comparação antes/depois ao segurar o botão
- Upload de imagens PNG, JPG/JPEG e WebP
- Download do resultado editado em PNG
- Interface em português
- Layout responsivo para telas menores
- Estados acessíveis nos botões, incluindo `aria-pressed`

## Como usar

1. Escolha uma área predefinida ou clique em **Adicionar área**.
2. Arraste o oval para reposicioná-lo sobre a foto.
3. Use a bolinha no canto inferior direito para redimensionar a área.
4. Ajuste a intensidade no controle deslizante.
5. Clique em **Ver resultado** para ocultar os controles de edição.
6. Segure o botão para visualizar o antes e solte para voltar ao depois.
7. Clique em **Baixar imagem editada** para exportar o resultado.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- Canvas API
- Git e GitHub
- GitHub Pages

## Executar localmente

1. Clone ou baixe este repositório:

   ```bash
   git clone https://github.com/Brenojj-08/aesthetic-face-simulator/tree/main
   ```

2. Abra a pasta do projeto no Visual Studio Code.
3. Abra o `index.html` usando a extensão **Live Server**.

## Estrutura do projeto

```text
.
├── index.html
├── style.css
├── script.js
├── face-model.jpg.png
└── README.md
```

## Observações

- O efeito visual é uma simulação educacional executada no navegador.
- As áreas podem ser movidas e redimensionadas livremente.
- A imagem enviada pelo usuário é processada localmente durante a sessão.

## Aviso

Este projeto é exclusivamente educacional. Ele não oferece aconselhamento médico, diagnóstico, recomendação de tratamento, orientação clínica ou garantia de resultados.

## Autor

Desenvolvido como projeto de interface web interativa.
