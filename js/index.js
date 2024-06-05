const url = window.location.href;

const urlObj = new URL(url);
var lojaCpfCnpj = urlObj.searchParams.get("id");
let lojaID;
var telefoneCliente = urlObj.searchParams.get("tel");

if (lojaCpfCnpj) {
    var cpf_cnpj = lojaCpfCnpj;
    var tel = telefoneCliente;

    localStorage.setItem('idUsuario', cpf_cnpj);
    localStorage.setItem('telUsuario', tel);
} else {

    if (localStorage.getItem('idUsuario')) {
        lojaCpfCnpj = localStorage.getItem('idUsuario');
        telefoneCliente = localStorage.getItem('telUsuario');
    } else {
        //window.location.href = 'http://pedidozap.app/cadastro.html';
    }
}

document.getElementById("loadingPopup").style.display = "flex";

function dadosLoja() {
    $.ajax({
        url: `https://mundodigital.ddns.net:5000/api/Cliente/${lojaCpfCnpj}?Coluna=cnpj`, // Substitua pelo URL correto da sua API
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            if (data.bloqueadO_CLI === false) {
                loja_ddns = `${data.weB_DDNS_CLI}:${data.weB_PORTA_CLI}`;
                //loja_ddns = 'mundodigital.ddns.net:3001'
                lojaID = data.iD_CLI;
                carregarProdutos(loja_ddns);
            } else {
                console.log("error")
            }
        },
        error: function (error) {
            console.error('Erro na solicitação AJAX:', error);
        }
    });
}



dadosLoja();

const app = document.querySelector('.app');
let mainSection;
let sidebarScroll;
let loja;
let produtos;
let bairrosEntrega;
let categorias;

function carregarProdutos(loja_ddns) {
    $.ajax({
        url: `https://${loja_ddns}/api/pedido?id=${lojaID}`,
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            console.log(data.loja);
            loja = data.loja[0];
            produtos = data.produtos;
            categorias = data.categorias;
            bairrosEntrega = data.bairros;
            console.log(url);

            createPage(produtos, categorias);
            document.getElementById("loadingPopup").style.display = "none";
        },
        error: function (error) {
            console.error('Erro na solicitação AJAX:', error);
        }
    });
}

function createPage(produtos, categorias) {
    categorias.sort((a, b) => a.GRUP_DESCRICAO.localeCompare(b.GRUP_DESCRICAO));
    let pedidoMin = loja.VR_PEDIDO_MIN || 0;
    app.innerHTML = `
        <div class="container-fluid">
            <div class="row">
                <!-- Barra lateral -->
                <nav id="sidebar" class="col-md-3 col-lg-3 d-md-block bg-light sidebar mb-3">
                    <div class="position-sticky">
                        <div class="sidebar-header text-center py-1">
                            <img src="/fotos/${lojaCpfCnpj}/logo/logo.png" onerror="this.src='assets/png/placeholder_logo.png'" id="logoLoja" alt="Logotipo da Loja" class="img-fluid rounded-circle"
                                style="max-width: 140px;">
                            <p class="small pt-2" style="color:black;"><strong>Pedido Mínimo:</strong> R$ ${parseFloat(pedidoMin, 10).toFixed(2)}</p>    
                        </div>
                        
                        <div class="sidebar-scroll">
                            <ul class="nav flex-column">
                                <li class="nav-item"><button type="button" class="btn btn-outline-dark btn-sm categoria-btn ver-todos" style="width: 98%; font-weight: 500;">Ver Todos</button></li>
                                ${categorias.map(categoria => {
        var nomeFormatado = primeiraLetraMaiuscula(categoria.GRUP_DESCRICAO);
        const produtosCategoria = produtos.filter(produto => produto.GRUP_DESCRICAO === categoria.GRUP_DESCRICAO);
        if (produtosCategoria.length > 0) {
            return `<li class="nav-item">
                                                    <button type="button" class="btn btn-outline-dark btn-sm categoria-btn ver-categoria" style="width: 98%; font-weight: 500;" data-categoria="${categoria.GRUP_DESCRICAO}">
                                                        <a class="nav-link categoria-item ver-categoria" data-categoria="${categoria.GRUP_DESCRICAO}">${nomeFormatado.trim()}</a>
                                                    </button>
                                                </li>`;
        }
        return '';
    }).join('')}
                            </ul>
                        </div>
                    </div>
                </nav>
                <main class="col-md-9 col-lg-9 ms-sm-auto">
                </main>
            </div>
        </div>

        <!-- Botão de alternância para mostrar/ocultar a barra lateral em telas pequenas -->
        <button id="sidebarToggle" class="btn d-md-none bg-light toggle-button">
            <svg width="16" height="16" viewBox="6 6 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 7H26M4 15H26M4 23H26" stroke="#555" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
            </svg>
        </button>
    `;
    mainSection = document.querySelector('main');
    sidebarScroll = document.querySelector('.sidebar-scroll');

    if (!loja.OPERANDO_EMP) {
        $("#avisoFechado").show();

    }
    // Adiciona produtos iniciais com botão "Ver Mais"
    addInitialProducts(produtos, categorias);
}

function addInitialProducts(produtos, categorias) {
    mainSection.innerHTML = `
        <div class="row container-fluid content slide-right" id="loja-container-main">
            <!-- Conteúdo da página de pedidos -->
            ${categorias.map(categoria => {
        var nomeFormatado = primeiraLetraMaiuscula(categoria.GRUP_DESCRICAO);
        const produtosCategoria = produtos.filter(produto => produto.GRUP_DESCRICAO === categoria.GRUP_DESCRICAO).slice(0, 8); // Apenas os primeiros 8 produtos
        if (produtosCategoria.length > 0) {
            return `
                        <div id="${nomeFormatado.trim()}" class="row categoria-titulo container-fluid">
                            <h3 id="categoria-${categoria.ID_GRUPO}">${nomeFormatado.trim()}</h3>
                            <div class="ver-mais-top text-center d-flex" >
                            <button class="btn btn-link btn-sm ver-mais" data-categoria="${categoria.GRUP_DESCRICAO}" style="float:left; border:none; font-weight:500; color:red">Ver todos</button>
                        </div>
                        </div>
                        ${produtosCategoria.map(createProductCard).join('')}
                        <div class="text-center ver-mais-bottom" style="width: 100%; ">
                            <button class="btn btn-link btn-sm ver-mais" data-categoria="${categoria.GRUP_DESCRICAO}" style="float:left; border:none; font-weight:500; color:red;">Ver todos</button>
                        </div>
                    `;
        }
        return ''; // Não renderiza a categoria se não houver produtos
    }).join('')}
        </div>
    `;
    var contentElement = document.getElementById('loja-container-main');
    contentElement.classList.add('slide-left');
    setTimeout(function () {
        contentElement.classList.remove('slide-right');
        contentElement.classList.remove('slide-left');
    }, 500);
}

function createProductCard(produto) {
    let imgOnError = "/assets/jpg/placeholder_thumb.jpg";

    var nomeFormatado = primeiraLetraMaiuscula(produto.NOME_PROD)
    return `
        <div class="product-card col-sm-6 col-md-6 col-lg-4 col-xl-3 p-1" id="product-${produto.ID_PROD}" data-product-id="${produto.ID_PROD}">
        <!-- Conteúdo do product-card aqui -->
            <div class="card shadow-sm" style="height:100px;">
                <div class="row no-gutters">
                    <div class="col-4 p-2 " style="height: 100px;">
                        <img src="/fotos/${lojaCpfCnpj}/${produto.ID_PROD}/${produto.ID_PROD}_thumb.jpg" loading="lazy" onerror="this.src='${imgOnError}'" class="card-img rounded" alt="COD-${produto.ID_PROD}">
                    </div>
                    <div class="col-8 card-body p-0 m-0" bis_skin_checked="1">
                        <div class="row p-0 pr-2 m-0" bis_skin_checked="1" style="height:55px;">
                            <h5 class="card-title small texto-cortado text-right m-0 p-1 pt-2" style="width:100%;">${nomeFormatado.trim()}</h5>
                        </div>
                        <div class="row d-flex align-items-end m-1 justify-content-around mt-2" bis_skin_checked="1">
                            <p class="card-text m-0 p-0 pt-2 preco-card small" style="color: black; float:right;"><strong>R$ </strong><strong>${produto.VR_VENDA3_ESTOQUE.toFixed(2)}</strong></p>
                            <button type="button" class="btn btn-primary btn-sm p-1 btn-comprar" style="border-radius:5px;">
                                Comprar
                            </button>                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
}

// Função para adicionar mais produtos de uma categoria
function addMoreProducts(categoria) {
    mainSection.scrollTop = 0;
    sidebarScroll.scrollTop = 0;
    var contentElement = document.getElementById('loja-container-main');
    contentElement.classList.add('slide-right');
    var btnVoltar = `<div class="text-center mt-2" style="width: 100%;">
                        <button class="btn btn-link btn-sm voltar-todos" style="float:left;border:none; font-weight:500; color:red;">◁ Voltar</button>
                    </div> `
    var categoriaElement = `<div id="${categoria}" class="row categoria-titulo container-fluid" style="margin-top:5px;">
                                <h3 style="width: 100%;"}">${primeiraLetraMaiuscula(categoria)}</h3>
                            </div>`;
    contentElement.innerHTML = "";
    contentElement.innerHTML += btnVoltar;
    contentElement.innerHTML += categoriaElement;
    categoriaElement = document.getElementById(`${categoria}`);
    var produtosCategoria = produtos.filter(produto => produto.GRUP_DESCRICAO === categoria); // Produtos além dos primeiros 8
    contentElement.innerHTML += produtosCategoria.map(createProductCard).join('');
    contentElement.innerHTML += btnVoltar;
    // Adiciona classe para animação de movimento para a esquerda
    contentElement.classList.add('slide-left');
    setTimeout(function () {
        contentElement.classList.remove('slide-right');
        contentElement.classList.remove('slide-left');
    }, 500);

}

// Função para voltar à exibição inicial de produtos
function backToInitialView() {
    mainSection.scrollTop = 0;
    sidebarScroll.scrollTop = 0;
    var contentElement = document.getElementById('loja-container-main');
    contentElement.classList.remove('slide-left');

    addInitialProducts(produtos, categorias);
    toggleSidebar();
}

// Evento de clique no botão "Ver Mais"
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('ver-mais') || event.target.classList.contains('ver-categoria')) {
        const categoria = event.target.getAttribute('data-categoria');
        addMoreProducts(categoria);
    }
});

// Evento de clique no botão "Voltar"
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('ver-todos') || event.target.classList.contains('voltar-todos')) {
        backToInitialView();
    }
});

function primeiraLetraMaiuscula(texto) {
    var ignoredWords = ["de", "da", "do", "das", "dos", "para", "com", "em", "por", "sem", "o", "os", "a", "as", "e"]; // Lista de palavras a serem ignoradas
    var palavras = texto.toLowerCase().split(" ");
    for (var i = 0; i < palavras.length; i++) {
        // Capitaliza a primeira letra de cada palavra, exceto se estiver na lista de palavras ignoradas
        if (!ignoredWords.includes(palavras[i]) || i === 0) {
            palavras[i] = palavras[i].charAt(0).toUpperCase() + palavras[i].slice(1);
        }
    }
    return palavras.join(" ");
}

function getColor() {
    // Selecione a imagem
    var image = document.getElementById('logoLoja');

    $(image).on('load', function () {
        // Instancie o ColorThief
        var colorThief = new ColorThief();

        // Extraia as cores principais da imagem
        var colors = colorThief.getPalette(image, 2); // Aqui você pode ajustar o número de cores desejadas

        var cor1 = 'rgb(' + colors[0][0] + ',' + colors[0][1] + ',' + colors[0][2] + ')';
        // Aplique as cores extraídas aos elementos no seu site
        $('body').css('background-color', cor1);
    })

}



function toggleSidebar() {
    if ($(window).width() >= 768) {
        $("#sidebar").addClass("active");
        $("main").addClass("active");
        $("header").addClass("active");
    } else {
        $("#sidebar").removeClass("active");
        $("main").removeClass("active");
        $("header").removeClass("active");
        $("#sidebarToggle").removeClass("active");
    }
}

// Chama a função ao carregar a página
toggleSidebar();

// Chama a função sempre que a janela for redimensionada
$(window).resize(function () {
    toggleSidebar();
});

// Mostra/oculta a barra lateral quando o botão é clicado em telas pequenas
$(document).on('click', '#sidebarToggle', function () {
    $("#sidebar").toggleClass("active");
    $("#sidebarToggle").toggleClass("active");
});

$(document).on('click', '.categoria-btn', function () {
    $("#sidebar").removeClass("active");
    $("#sidebarToggle").removeClass("active");
});

// Evento de clique no botão "Comprar"
$(document).on('click', '.product-card', function () {
    // Aqui você pode abrir a popup e preenchê-la com os dados do produto
    const productId = $(this).closest('.product-card').data('product-id');
    console.log("esse é o id do produto clicado para comprar:", productId);

    // Abra a popup e preencha-a com os dados do produto
    openProductPopup(getProductById(produtos, productId));
});

function openProductPopup(product) {
    let imgOnError = "/assets/jpg/placeholder_thumb.jpg";

    const popupSelector = '#productModal';
    let qtdCarrinho = 0;
    if (carrinho) {
        const existingProductIndex = carrinho.findIndex(item => item.id === product.ID_PROD);
        if (existingProductIndex != -1) {
            qtdCarrinho = carrinho[existingProductIndex].quantidade;
        }
    }

    // Preencha a popup com os dados do produto
    $(popupSelector).find('.modal-title').text(product.NOME_PROD);

    // Clear the carousel inner content
    $('#carouselInner').empty();

    // Adicione as imagens ao carousel
    let images = [
        `${product.ID_PROD}_original.jpg`,
        `${product.ID_PROD}_1.jpg`,
        `${product.ID_PROD}_2.jpg`,
        `${product.ID_PROD}_3.jpg`
        // Adicione mais imagens conforme necessário
    ];

    images.forEach((image, index) => {
        let activeClass = index === 0 ? 'active' : '';
        let imgElement = `
            <div class="carousel-item ${activeClass}">
                <img src="/fotos/${lojaCpfCnpj}/${product.ID_PROD}/${image}" alt="${product.NOME_PROD}" class="d-block w-100" onerror="handleImageError(this, ${index})">
            </div>
        `;
        $('#carouselInner').append(imgElement);
    });

    $(popupSelector).find('.modal-body').html(`
        <p class="m-0 p-0 text-right" style="font-size:xx-small"><i>*Imagens meramente ilustrativas</i></p>        
        <p style="font-size:x-small"><i><strong>Descrição:</strong> asdjo asd,asod ad,sdla,dslaçs pĺapś pópóaspódaçlçfkapújgla piplfkasjfas'plasdçlklapsdaslkfçlasjkfaplçm plkfgdplkalsljkf lkdçlfdsĺfflpsik  çkslkdaçljtpáj ápjfçakopaialjdflkaçĺ fapklsakfpçkfçaikstye</i></p>
        <p id="productPrice" style="color:green; font-weigth:strong;">R$ ${product.VR_VENDA3_ESTOQUE.toFixed(2)}</p>
        <div class="row pl-3">
            <label for="quantidade">Quantidade:</label>        
            <form class="quantity ml-2">
                <input type="button" value="━" data-index="0" class="btn-outline-danger qtyminus minus p-0 m-0" field="quantity" style="width: 25px">
                <input type="number" id="quantidadeProduto" name="quantidade" value="1" min="1" max="${product.QTD_ATUAL_ESTOQUE - qtdCarrinho}" data-index="0" class="qty p-0 m-0" data-product-id="${product.ID_PROD}">
                <input type="button" value="✚" data-index="0" class="btn-outline-primary qtyplus plus p-0 m-0" field="quantity" style="width: 25px">
            </form>
        </div>
        <p class="m-0" style="font-size:0.8rem;">Estoque: ${product.QTD_ATUAL_ESTOQUE - qtdCarrinho}</p>
        <p class="m-0" id="qtdCarrinho" style="font-size:0.7rem; font-weight:bold; display:none">Adicionado na Sacola: ${qtdCarrinho}</p>
        
    `);
    if (qtdCarrinho > 0) {
        $('#qtdCarrinho').show();
    }
    // Abra a popup
    $(popupSelector).modal('show');
}
// Função para tratar erro de imagem
function handleImageError(img, index) {
    if (index === 0) {
        img.src = "/assets/jpg/placeholder_thumb.jpg";
    } else {
        img.closest('.carousel-item').remove();
    }
}

let grid = document.querySelector(".app");
let filterInput = document.getElementById("filterInput");
let filterTimer;

filterInput.addEventListener('keyup', function () {
    $(".svg-search-loading").css("display", "block");
    clearTimeout(filterTimer);
    filterTimer = setTimeout(filterProducts, 1000);

});

function filterProducts() {
    //console.log(produtos);
    if (filterInput.value.toUpperCase().trim() === '') {
        backToInitialView();
        $(".svg-search-loading").css("display", "none");
        return;
    }
    let filterValue = filterInput.value.toUpperCase();
    var contentElement = document.getElementById('loja-container-main');
    var lastContentElement = contentElement;
    $('.ver-mais').css("display", "none");
    $('.voltar-todos').css("display", "none");
    var categoriaElement = `<div id="buscaProdutos" class="row categoria-titulo container-fluid" style="margin-top:5px;">
                                <h3 style="width: 100%;"}">Resultados da Busca</h3>
                            </div>`;
    contentElement.innerHTML = "";
    contentElement.innerHTML += categoriaElement;
    var produtosCategoria = produtos.filter(produto => produto.NOME_PROD.toUpperCase().indexOf(filterValue) > -1); // Produtos além dos primeiros 8
    contentElement.innerHTML += produtosCategoria.map(createProductCard).join('');
    $(".svg-search-loading").css("display", "none");

}

// Função para agrupar os produtos por categoria
function groupByCategory(produtos, categorias) {
    const grouped = {};

    categorias.forEach(categoria => {
        grouped[categoria.GRUP_DESCRICAO] = produtos.filter(produto => produto.GRUP_DESCRICAO === categoria.GRUP_DESCRICAO);
    });

    return grouped;
}

function getProductById(produtos, productId) {
    product = produtos.find(produto => produto.ID_PROD === productId);
    if (product) {
        return product;
    } else {
        console.error(`Produto com ID ${productId} não encontrado.`);
        return null;
    }
}


//////////////////////////////////////////////////////////////////////////////
//***************aqui está o código relacionado a sacola ********************/
/////////////////////////////////////////////////////////////////////////////


// Verifique se a sessionStorage já contém a sacola
let carrinho = sessionStorage.getItem('carrinho');
let cliente;
if (!carrinho) {
    // Se a sessionStorage estiver vazia, inicie um carrinho vazio
    carrinho = [];
} else {
    // Se a sessionStorage contém dados, analise o JSON
    carrinho = JSON.parse(carrinho);
}

// Verifica e atualiza o indicador de itens no carrinho sempre que houver alterações no carrinho
function atualizarIndicadorCarrinho() {
    var $carrinhoBadge = $('#carrinho-badge'); // Elemento do indicador de itens no carrinho

    if (carrinho) {
        var numeroItens = carrinho.length; // Obter o número de itens no carrinho

        // Atualizar o conteúdo do indicador com o número de itens
        $carrinhoBadge.text(numeroItens);
    } else {
        // Se o carrinho não existir, definir o indicador como 0
        $carrinhoBadge.text('');
    }
}

// Atualizar o preço total do produto quando a quantidade muda
$(document).on('change', '#quantidadeProduto', function () {
    const novaQuantidade = parseInt($(this).val(), 10);
    const qtdEstoque = parseInt($('#quantidadeProduto').attr('max'), 10);
    if (novaQuantidade > qtdEstoque) {
        $(this).val(qtdEstoque)
    } else if (novaQuantidade > 0) {
        return
    } else {
        $(this).val(1);
    }
});


// Evento de clique no botão "Adicionar à Sacola"
$(document).on('click', '#addToCartButton', function () {
    // Obter detalhes do produto a partir do modal

    const productId = $('.qty').data('product-id');
    console.log(productId);
    const productName = $('#productModal').find('.modal-title').text();
    const productImage = $('#productModal').find('.modal-body img').attr('src');
    const productPrice = parseFloat($('#productPrice').text().replace('R$ ', '').replace(',', '.'));
    const productQuantity = parseInt($('#quantidadeProduto').val(), 10);
    const productEstoque = parseInt($('#quantidadeProduto').attr('max'), 10);

    if (productQuantity > productEstoque) {
        alert('A quantidade não pode ser maior que o estoque atual')
        return;
    }
    // Verificar se o produto já está no carrinho
    const existingProductIndex = carrinho.findIndex(item => item.id === productId);
    // Criar um objeto representando o produto
    if (existingProductIndex !== -1) {
        // O produto já está no carrinho, atualize a quantidade
        carrinho[existingProductIndex].quantidade += productQuantity;
    } else {
        const produto = {
            id: productId,
            nome: productName,
            imagem: productImage,
            preco: productPrice,
            quantidade: productQuantity,
            estoque: productEstoque
        };
        console.log(produto);
        // Adicionar o produto ao carrinho
        carrinho.push(produto);
    }

    // Salvar o carrinho na sessionStorage
    sessionStorage.setItem('carrinho', JSON.stringify(carrinho));

    // Atualizar a exibição da sacola na página
    atualizarExibicaoCarrinho();
    // Após adicionar o produto ao carrinho com sucesso
    $('#productModal').modal('hide');

    $('#confirmacaoModal').modal('show');


    $('#sacolaButton').on('click', function () {
        $("input[name='opcaoEntrega']").prop("checked", false);
        $('#taxaEntrega').hide();
        $("#taxa-entrega").text('0.00');
        atualizarExibicaoCarrinho();
    });

    // Ouvinte de evento para o botão "Abrir Sacola" no modal de confirmação
    $('#abrirSacolaBtn').on('click', function () {
        $("input[name='opcaoEntrega']").prop("checked", false);
        $('#taxaEntrega').hide();
        $("#taxa-entrega").text('0.00');
        atualizarExibicaoCarrinho();
        // Fechar o modal de confirmação
        $('#confirmacaoModal').modal('hide');

        // Abrir o modal da sacola
        $('#sacolaModal').modal('show');
    });

});

function atualizarExibicaoCarrinho() {
    carrinho = JSON.parse(sessionStorage.getItem('carrinho'));
    if (!carrinho) {
        // Se a sessionStorage estiver vazia, inicie um carrinho vazio
        carrinho = [];
    }
    atualizarIndicadorCarrinho();
    // Seletor para a exibição da sacola
    const carrinhoSelector = '#sacolaLista';

    if (carrinho.length === 0) {
        // Carrinho vazio, ocultar o botão "Continuar"
        $('#finalizarCompra').hide();
        $('#sacolaVazia').show();
    } else {
        // Carrinho não está vazio, exibir o botão "Continuar"
        $('#finalizarCompra').show();
        $('#sacolaVazia').hide();
        // Limpar a exibição da sacola
    }

    $(carrinhoSelector).empty();

    let total = 0;
    let taxaEntrega = parseFloat($('#taxa-entrega').text().replace('R$ ', '')) || 0;

    // Iterar sobre os produtos no carrinho e atualizar a exibição
    carrinho.forEach((product, index) => {
        // Verificar se o preço não é nulo
        const precoFormatado = product.preco !== null ? product.preco : 0;
        product.precoTotal = precoFormatado * product.quantidade;

        // Crie um novo elemento de cartão Bootstrap para cada produto na sacola
        const produtoHTML = `
            <div class="card mb-1">
                <div class="card-body p-1">
                    <div class="row">
                        <div class="col-0 col-sm-2 col-md-2 d-none d-sm-block">
                            <img src=${product.imagem} onerror="this.src='assets/jpg/placeholder_thumb.jpg'" alt="${product.ID_PROD}" class="img-thumbnail" style="max-width: 50px; max-height: 50px;">
                        </div>
                        <div class="col-5 col-sm-4 col-md-4 small texto-cortado align-self-center">
                        ${product.quantidade}x ${product.nome}
                        </div>
                        <div class="col-3 col-md-2 align-self-center small p-1">
                            <form class='quantity' action='#'>
                                <input type='button' value='━' data-index="${index}" class='btn-outline-danger qtyminus minus p-0 m-0' field='quantity' />
                                <input type='number' name='quantity' value='${product.quantidade}' data-index="${index}" class='qty quantidade-produto' />
                                <input type='button' value='✚' data-index="${index}" class='btn-outline-primary qtyplus plus p-0 m-0' field='quantity' />
                            </form>
                        </div>
                        <div class="col-3 col-sm-2 col-md-2 p-1 align-self-center">
                            <span class="preco-produto small">R$ ${product.precoTotal.toFixed(2)}</span>
                        </div>
                        <div class="col-1 col-md-2 p-1 align-self-center">                        
                            <button class="btn px-2 py-0 m-0 remover-produto" data-index="0">
                                <i class="fa fa-trash" style="color: crimson;"></i>
                            </button>                                            
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Adicione o produto à exibição da sacola
        $(carrinhoSelector).append(produtoHTML);

        // Se o preço não for nulo, atualize o total
        if (product.preco !== null) {
            total += product.preco * product.quantidade;
        }
    });

    total += taxaEntrega;
    $(".sacolaTotal").empty(); // Limpa o conteúdo existente
    // Adicione o total à exibição da sacola
    $(".sacolaTotal").append(`

                <div class="btn btn-light disabled" disabled><strong>Total: R$ <span id="total-carrinho">${total.toFixed(2)}</span></strong></div>
    `);
}

// Chame a função para inicializar a exibição da sacola
atualizarExibicaoCarrinho();

// Atualizar o preço total do produto quando a quantidade muda
$(document).on('change', '.quantidade-produto', function () {
    const index = $(this).data('index');
    const novaQuantidade = parseInt($(this).val(), 10);
    const estoqueAtual = carrinho[index].estoque;
    if (novaQuantidade > estoqueAtual) {
        alert(`A quantidade não pode ser maior que o estoque atual: ${estoqueAtual}`);
        $(this).val(estoqueAtual);
        return;
    }
    if (novaQuantidade > 0) {
        carrinho[index].quantidade = novaQuantidade;
        sessionStorage.setItem('carrinho', JSON.stringify(carrinho));
        // Atualize a exibição da sacola
        atualizarExibicaoCarrinho();
    } else {
        const index = $(this).data('index');
        // Adiciona uma confirmação antes de remover
        const confirmacao = confirm('Deseja realmente remover este produto do carrinho?');

        if (confirmacao) {
            // Remova o produto do carrinho com base no índice
            carrinho.splice(index, 1);
            // Salve o carrinho atualizado na sessionStorage
            sessionStorage.setItem('carrinho', JSON.stringify(carrinho));
            // Atualize a exibição da sacola
            atualizarExibicaoCarrinho();
        } else {
            $(this).val(1);
        }
    }
});

// Delegação de eventos para os botões de "+" e "-"
$(document).on('click', '.quantity .plus', function (e) {
    let $input = $(this).prev('input.qty');
    let val = parseInt($input.val());
    $input.val(val + 1).change();
});

$(document).on('click', '.quantity .minus', function (e) {
    let $input = $(this).next('input.qty');
    var val = parseInt($input.val());
    if (val > 0) {
        $input.val(val - 1).change();
    }
});



// Evento de clique no botão "Remover" em um produto da sacola
$(document).on('click', '.remover-produto', function () {
    const index = $(this).data('index');
    // Adiciona uma confirmação antes de remover
    const confirmacao = confirm('Deseja realmente remover este produto do carrinho?');

    if (confirmacao) {
        // Remova o produto do carrinho com base no índice
        carrinho.splice(index, 1);
        // Salve o carrinho atualizado na sessionStorage
        sessionStorage.setItem('carrinho', JSON.stringify(carrinho));
        // Atualize a exibição da sacola
        atualizarExibicaoCarrinho();
    }

});

// Atualize a exibição da sacola na página ao carregá-la
atualizarExibicaoCarrinho();



//'http://localhost:3000/api/consultarcliente'

// Evento de clique no botão "Finalizar Pedido"
$(document).on('click', '#finalizarCompra', function () {
    if (!loja.OPERANDO_EMP) {
        $('#finalizarPedidoModal').modal('hide');
        alert('No momento não estamos aceitando pedidos pelo site.')
        return;
    }
    // Abra a nova popup de finalização de pedido e formulário de cadastro
    $('#finalizarPedidoModal').modal('show');
    $('#telefone').val(formatTelefone(telefoneCliente));
    checkClienteByTelefone($('#telefone').val(), lojaID)
});


// Evento de clique no botão "Voltar"
$(document).on('click', '#voltarSacola', function () {
    // Abra a nova popup de finalização de pedido e formulário de cadastro
    $('#sacolaModal').modal('show');
});



// Quando o usuário digita no campo de telefone
$('#telefone').on('input', function () {
    const telefone = $(this).val().replace(/\D/g, '');

    // Verificar se o telefone tem 11 dígitos
    if (telefone.length === 11) {
        // Faça a solicitação AJAX após a formatação
        checkClienteByTelefone($(this).val(), lojaID);
    }
});

// Variável para armazenar o ID do rádio selecionado
var idRadioSelecionado = null;
// Função para verificar o cliente com base no número de telefone
function checkClienteByTelefone(telefone, id) {

    // Mostrar o popup de carregamento
    document.getElementById("loadingPopup").style.display = "flex";

    $.ajax({
        url: `https://${loja_ddns}/api/consultarcliente`,
        data: { telefone: telefone, id: id },
        method: 'GET',
        success: function (data) {
            cliente = data.cliente;
            enderecos = data.enderecos;
            var listaEnderecos = $("#listaEnderecos");
            var enderecoNovo = $(`  <div class="form-check">
                                        <input class="form-check-input" type="radio" name="opcaoEndereco" id="enderecoNovo"
                                            value="enderecoNovo">
                                        <label class="form-check-label" for="enderecoNovo">Novo Endereço</label>
                                    </div>
                                    <!-- Campos para Outro Endereço (inicialmente ocultos) -->
                                    <div id="enderecoCliente" style="display: none;">
                                        <div class="form-group">
                                            <label for="rua">Rua</label>
                                            <input type="text" class="form-control" id="rua">
                                        </div>
                                        <div class="form-group">
                                            <label for="numero">Número</label>
                                            <input type="text" class="form-control" id="numero">
                                        </div>
                                        <div class="form-group">
                                            <label for="complemento">Complemento</label>
                                            <input type="text" class="form-control" id="complemento">
                                        </div>
                                        <div class="form-group">
                                            <label for="cidade">Cidade</label>
                                            <select class="form-control" id="dropdownCidades">
                                                <!-- Options serão adicionados dinamicamente aqui -->
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label for="cidade">Bairro</label>
                                            <select class="form-control" id="dropdownBairros">
                                                <!-- Options serão adicionados dinamicamente aqui -->
                                            </select>
                                        </div>
                                        <!--<div class="form-group">
                                            <label for="cidade">Cidade</label>
                                            <input type="text" class="form-control" id="cidade" value="${loja.NOME_CID}" readonly>
                                        </div>-->
                                    </div>`)

            if (cliente.length > 0) {

                listaEnderecos.empty();

                $('#nome').val(cliente[0].RAZAO_CLI);

                // Função para formatar um endereço
                function formatarEndereco(endereco) {
                    return `${endereco.RUA_CLI_END}, ${endereco.NUMERO_CLI_END}<br>${endereco.NOME_BAIRRO.trim()} - ${endereco.NOME_CID}`;
                }

                enderecos.forEach(function (endereco, index) {
                    var enderecoFormatado = formatarEndereco(endereco);
                    var radioId = `enderecoRadio${index}`;
                    var taxaBairro = endereco.VR_FRETE_BAIRROQ;

                    // Criar card de endereço
                    var labelCard = $(`
                        <label class="form-check-label m-1" for="${radioId}">
                            <div class="card">
                                <div class="card-body p-2 small">
                                    <h6 class="card-title">Endereço ${index + 1}</h6>
                                    <p class="card-text enderecoFormatado">${enderecoFormatado}</p>
                                    <div class="flex-box">
                                        <a href="#" class="btn-excluir-endereco p-0" style="display:none; float:left; color:black">Excluir</a>
                                        <a href="#" class="btn-editar-endereco p-0" style="display:none; float:right;">Editar</a>
                                    </div>
                                </div>
                            </div>
                        </label>
                    `);

                    // Criar opção de rádio
                    var radioOption = $(`<div class="endereco-card form-check form-check-inline"></div>`)
                        .append($(`<input class="form-check-input enderecoPadrao" type="radio" name="opcaoEndereco" id="${radioId}" data-id-endereco="${endereco.ID_CLI_END}" data-taxa-endereco="${taxaBairro}" value="enderecoSalvo">`))
                        .append(labelCard);

                    // Adicionar opção de rádio e card à lista
                    $("#listaEnderecos").append(radioOption);
                });



                $("#listaEnderecos").append($(enderecoNovo));

            } else {
                // Ocultar o card de endereço padrão
                $('#enderecoPadraoCard').hide();
                listaEnderecos.empty();
                $("#listaEnderecos").append($(enderecoNovo));

            }

            // Ocultar o popup de carregamento no sucesso da solicitação
            document.getElementById("loadingPopup").style.display = "none";
        },
        error: function (error) {
            console.log('Erro na solicitação AJAX: ' + error);

            // Ocultar o popup de carregamento no sucesso da solicitação
            document.getElementById("loadingPopup").style.display = "none";
        }
    });
}

function cidadesSemRepetir(bairros) {
    var cidades = {};
    bairros.forEach(function (bairro) {
        if (!cidades[bairro.ID_CIDADE_BAIRRO]) {
            cidades[bairro.ID_CIDADE_BAIRRO] = bairro.NOME_CID;
        }
    })

    var listaCidades = [];
    for (var idCidade in cidades) {
        listaCidades.push({ ID_CIDADE: idCidade, NOME_CIDADE: cidades[idCidade] });
    }

    return listaCidades;
}

function removerAcentos(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function popularBairros(bairros, id) {
    var dropdownBairros = $("#dropdownBairros");
    dropdownBairros.empty();
    dropdownBairros.append('<option value="">Selecione um bairro</option>');
    var idCidade = parseInt(id);

    var bairrosDaCidade = bairros.filter(function (bairro) {
        return bairro.ID_CIDADE_BAIRRO === idCidade;
    })

    // Adicionar opções ao dropdown
    bairrosDaCidade.forEach(function (bairro) {
        dropdownBairros.append('<option value="' + bairro.ID_BAIRRO + '">' + bairro.NOME_BAIRRO.trim() + '</option>');
    });

    // Ao selecionar um bairro no dropdown
    dropdownBairros.on("change", function () {
        $("#dropdownBairros").removeClass("is-invalid");

        var selectedBairroId = $(this).val();

        $('#taxaEntrega').show();

        // Encontrar o bairro selecionado nos dados originais para obter informações adicionais, se necessário
        var selectedBairro = bairros.find(function (bairro) {
            return bairro.ID_BAIRRO === parseInt(selectedBairroId);
        });

        if (selectedBairro && selectedBairro.VR_FRETE_BAIRROQ !== 0) {
            $('#taxa-entrega').text('R$ ' + selectedBairro.VR_FRETE_BAIRROQ.toFixed(2));
            atualizarExibicaoCarrinho();
        } else {
            $('#taxa-entrega').text('Grátis');
        }
    });
}

function popularCidades(bairros) {
    var dropdownCidades = $("#dropdownCidades");
    var listaBairros = $("#listaBairros");

    var cidades = cidadesSemRepetir(bairros);

    // Limpar dropdown e adicionar uma opção para selecionar
    dropdownCidades.empty();
    dropdownCidades.append('<option value="">Selecione uma cidade</option>');


    // Adicionar as cidades ao dropdown
    cidades.forEach(function (cidade) {
        dropdownCidades.append('<option value="' + cidade.ID_CIDADE + '">' + cidade.NOME_CIDADE.trim() + '</option>');
    });

    // Adicionar funcionalidade de pesquisa ao clicar no dropdown
    dropdownCidades.on('click', function () {
        $(this).find("option").show();
    });
    // Ao selecionar uma cidade
    dropdownCidades.on("change", function () {
        var idCidade = $(this).val();
        listaBairros.hide();
        popularBairros(bairros, idCidade);
        $("#dropdownCidades").removeClass("is-invalid");
    });
}


function formatTelefone(telefone) {

    let numeroTelefone;

    if (telefone.length === 11) {
        numeroTelefone = telefone
    } else {
        // Remover caracteres não numéricos (por exemplo, traços e espaços)
        numeroTelefone = $(telefone).val().replace(/\D/g, '');
    }


    // Verifica se o número tem 11 dígitos
    if (numeroTelefone.length === 11) {
        // Formata para (99) 9 9999-9999
        numeroTelefone = numeroTelefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        $('#retirada').prop('disabled', false);
        $('#entrega').prop('disabled', false);

    } else {
        $('#retirada').prop('disabled', true);
        $('#entrega').prop('disabled', true);
        $("#retirada").prop("checked", true).change();
    }

    // Atualiza o valor do campo de entrada com o número formatado
    telefone.value = numeroTelefone;

    return numeroTelefone;
}

$(document).on('click', '#continuarEndereco', function () {
    const telefone = $('#telefone').val();
    const nome = $('#nome').val();

    // Validação de telefone
    if (telefone.length !== 15) {
        alert("Telefone inválido. Deve conter 11 dígitos.");
        $("#telefone").addClass("is-invalid");
        return;
    } else {
        $("#telefone").removeClass("is-invalid");
    }

    // Validação de nome
    if ($.trim(nome) === "") {
        alert("Nome é obrigatório.");
        $("#nome").addClass("is-invalid");
        return;
    } else {
        $("#nome").removeClass("is-invalid");
    }
    if ($.trim(nome).length < 3) {
        alert("Nome deve ter mais que 2 caracteres.");
        $("#nome").addClass("is-invalid");
        return;
    } else {
        $("#nome").removeClass("is-invalid");
    }

    popularCidades(bairrosEntrega);
    // Abra a nova popup de finalização de pedido e formulário de cadastro
    if (!cliente) {
        checkClienteByTelefone($('#telefone').val(), lojaID);
    }
    $('#finalizarPedidoModal').modal('hide');
    $('#enderecoPedidoModal').modal('show');

});

$(document).on('click', '#continuarEndereco', function () {
    // Abra a nova popup de finalização de pedido e formulário de cadastro
    $('#finalizarPedidoModal').modal('show');

});

// Quando a opção de entrega é alterada
$('input[name="opcaoEntrega"]').on('change', function () {
    const opcaoSelecionada = $(this).val();

    if (opcaoSelecionada === 'retirada') {

        $('#opcoesEndereco').hide();
        $('#enderecoCliente').hide();
        $('#taxaEntrega').hide();
        $("#taxa-entrega").text('0.00');

        // Desmarcar qualquer opção radio que esteja marcada
        $("input[name='opcaoEndereco']:checked").prop("checked", false);

        // Mostrar o card com o endereço da loja
        $('#lojaCard').show();

        // Usar os dados da variável 'loja' para preencher o card
        const enderecoLoja = `${loja.RUA_EMP + ', ' + loja.NUMERO_EMP}<br>${loja.BAIRRO_EMP} - ${loja.NOME_CID}`
        $('#lojaEndereco').html(enderecoLoja);
        atualizarExibicaoCarrinho();
    } else if (opcaoSelecionada === 'entrega') {
        // Ocultar o card quando a opção for entrega
        $('#lojaCard').hide();
        $('#opcoesEndereco').show();
        //$("#taxa-entrega").text('0.00')//loja.VR_TAXA.toFixed(2));
        //$('#taxaEntrega').show();
        atualizarExibicaoCarrinho();
    } else {
        $('#lojaCard').hide();
        $('#opcoesEndereco').show();
    }
});

// Quando a opção de endereço é alterada
$('#listaEnderecos').on('change', 'input[name="opcaoEndereco"]', function () {
    const opcaoSelecionada = $(this).val();
    var taxa = $(this).data('taxa-endereco');;

    if (opcaoSelecionada === 'enderecoSalvo') {
        // Mostrar o card com o endereço da loja
        $('#enderecoCliente').hide();
        if (taxa != 0) {
            $("#taxa-entrega").text(`R$ ${taxa.toFixed(2)}`)
        } else {
            $("#taxa-entrega").text(`Grátis`)
        }
        $('#taxaEntrega').show();
        atualizarExibicaoCarrinho();

    } else if (opcaoSelecionada === 'enderecoNovo') {
        // Ocultar o card quando a opção for entrega
        $('#enderecoCliente').show();
        $("#taxa-entrega").text('0.00')
        $('#taxaEntrega').hide();
        atualizarExibicaoCarrinho();

    } else {
        $('#lojaCard').hide();
        $('#opcoesEndereco').hide();

    }
});

// Quando a forma de pagamento é alterada
$('#formaPagamento').on('change', function () {
    const formaPagamentoSelecionada = $(this).val();

    if (formaPagamentoSelecionada === '1') {
        // Se a forma de pagamento for "Dinheiro," mostrar o campo "Troco para quanto?"
        $('#trocoDiv').show();
    } else {
        // Se outra forma de pagamento for selecionada, esconder o campo "Troco para quanto?"
        $('#trocoDiv').hide();
        $('#troco').val('');
    }
});

function obterIdBairroPorNome(nomeBairro, bairros) {
    nomeBairro = nomeBairro.toLowerCase();
    var bairroEncontrado = bairros.find(function (bairro) {
        return bairro.NOME_BAIRRO.toLowerCase() === nomeBairro;
    });
    return bairroEncontrado ? bairroEncontrado.ID_BAIRRO : null;
}


////////////////////////////////////*AQUI COMEÇA O CÓDIGO RELACIONADO A CONFIRMAÇÃO DO PEDIDO *////////////////////////////////////////////////

$('#continuarPagamento').click(function () {


    // Recupere as informações do modal de dados pessoais
    const telefone = $('#telefone').val();
    const nome = $('#nome').val();
    const clienteID = cliente.length === 0 ? null : cliente[0].ID_CLI;
    const escolhaEntrega = $('input[name=opcaoEntrega]:checked').val() === 'entrega' ? 1 : 0;
    const escolhaEndereco = $('input[name=opcaoEndereco]:checked').val() === 'enderecoSalvo' ? 1 : 0;
    const taxa = parseFloat($('#taxa-entrega').text().replace('R$ ', '')) || 0;
    const rua = escolhaEntrega == 1 ? $('#rua').val() : loja.RUA_EMP;
    const numero = escolhaEntrega == 1 ? $('#numero').val() : loja.NUMERO_EMP;
    const complemento = $('#complemento').val();
    const bairro = escolhaEntrega == 1 ? $("#dropdownBairros").val() : loja.BAIRRO_EMP;
    const cidade = escolhaEntrega == 1 ? $("#dropdownCidades").val() : loja.ID_CIDADE_EMP;
    const endereco = $('input[name=opcaoEndereco]:checked').data('id-endereco') || null;

    // Validação de entrega ou retirada
    const opcaoEntrega = $('input[name="opcaoEntrega"]:checked');
    if (!opcaoEntrega.length) {
        alert("Selecione uma opção de entrega ou retirada.");
        return;
    }

    // Validação de endereço, se a entrega for escolhida
    if (opcaoEntrega.val() === "entrega") {
        const opcaoEndereco = $('input[name="opcaoEndereco"]:checked');
        if (!opcaoEndereco.length) {
            alert("Selecione um endereço padrão ou escolha um novo endereço.");
            return;
        }

        // Validação do novo endereço, se selecionado
        if (opcaoEndereco.val() === "enderecoNovo") {
            const rua = $("#rua").val();
            const numero = $("#numero").val();
            const bairro = $("#dropdownBairros").val();
            const cidade = $("#dropdownCidades").val();
            if ($.trim(rua) === "" || $.trim(numero) === "") {
                alert("A rua e número são obrigatórios");
                return;
            };

            if (cidade == "") {
                alert("Selecione uma cidade clicando na lista");
                $("#dropdownCidades").addClass("is-invalid");
                return;
            };

            if (bairro == "") {
                alert("Selecione o bairro clicando na lista");
                $("#dropdownBairros").addClass("is-invalid");
                return;
            };
        }
    }

    // Crie um objeto com as informações
    const dadosCliente = {
        clienteID,
        telefone,
        nome,
        escolhaEntrega,
        escolhaEndereco,
        taxa,
        rua, // Use o endereço do cadastro se for entrega e endereço padrão
        numero,
        complemento,
        bairro,
        cidade,
        endereco
    };
    // Salve o objeto no sessionStorage
    sessionStorage.setItem('dadosCliente', JSON.stringify(dadosCliente));

    $('#enderecoPedidoModal').modal('hide');
    $('#escolherPagamentoModal').modal('show');
});

$('#voltarContato').click(function (e) {
    $("input[name='opcaoEntrega']").prop("checked", false);
    $("input[name='opcaoEndereco']").prop("checked", false);
    $('#opcoesEndereco').hide();
    $('#lojaCard').hide();
    $('#taxaEntrega').hide();
    $("#taxa-entrega").text('0.00');
    atualizarExibicaoCarrinho();
    $('#finalizarPedidoModal').modal('show');
});

$('#voltarDados').click(function (e) {
    $('#enderecoPedidoModal').modal('show');
});

$('#confirmarPedido').click(function (e) {
    // Verifique se uma forma de pagamento foi selecionada
    const formaPagamento = $('#formaPagamento').val();
    if (!formaPagamento) {
        alert('Por favor, selecione uma forma de pagamento.');
        return;
    }

    // Se a forma de pagamento for "dinheiro", verifique se o campo "troco" está preenchido
    if (formaPagamento === '1') {
        const troco = parseFloat($('#troco').val());
        const total = parseFloat($('#total-carrinho')[0].innerText);
        if (!troco & troco != 0) {
            alert('Por favor, preencha corretamente o campo "Troco para quanto?"');
            $('#troco').addClass('is-invalid');
            return;
        }
        if (troco < total & troco != 0) {
            alert('Por favor, preencha um valor maior do que o valor Total');
            $('#troco').addClass('is-invalid');
            return;
        }
    }

    document.getElementById("loadingPopup").style.display = "flex";
    // Se todas as verificações passarem, prossiga com a confirmação do pedido
    enviarPedidoAPI();
    $('#escolherPagamentoModal').modal('hide');

});

function enviarPedidoAPI() {
    // Obtenha os dados do carrinho e dados do cliente da sessionStorage
    //const carrinho = JSON.parse(sessionStorage.getItem('carrinho'));
    const dadosCliente = JSON.parse(sessionStorage.getItem('dadosCliente'));
    // Obtenha os dados do modal de pagamento
    const precoTotal = parseFloat($('#total-carrinho').text()) - dadosCliente.taxa;
    const formaPagamento = $('#formaPagamento').val();
    const troco = $('#troco').val();
    const observacao = $('#observacao').val();

    // Construa um objeto que contenha todos os dados a serem enviados para a API
    let dadosParaEnviar = {
        carrinho,
        dadosCliente,
        formaPagamento,
        precoTotal,
        troco,
        observacao,
        lojaID
    };

    console.log(dadosParaEnviar);

    $.ajax({
        url: `https://${loja_ddns}/api/confirmarpedido`,
        method: 'POST', // Ou o método adequado para a sua API
        contentType: 'application/json',
        data: JSON.stringify(dadosParaEnviar),
        success: function (response) {
            // A solicitação foi bem-sucedida
            if (response.confirmado) {
                document.getElementById("loadingPopup").style.display = "none";
                sessionStorage.removeItem('carrinho');
                dadosParaEnviar = [];
                cliente = undefined;
                atualizarExibicaoCarrinho();
                // Faça qualquer outra ação necessária após a confirmação
                alert('Pedido enviado com sucesso! Você receberá atualizações sobre seu pedido pelo WhatsaApp informado');
            } else {
                document.getElementById("loadingPopup").style.display = "none";

                alert('Ocorreu um erro no envio do pedido.');

            }
        },
        error: function (error) {
            document.getElementById("loadingPopup").style.display = "none";

            console.log('Erro na solicitação AJAX: ' + error);
            alert('Ocorreu um erro no envio do pedido. Tente novamente');
        }
    });
}
