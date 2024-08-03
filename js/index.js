const url = window.location.href;

const urlObj = new URL(url);
var lojaCpfCnpj = urlObj.searchParams.get("id");
let lojaID;
var telefoneCliente = urlObj.searchParams.get("tel");

if (lojaCpfCnpj) {
    var cpf_cnpj = lojaCpfCnpj;
    var tel = telefoneCliente;

    if (cpf_cnpj != localStorage.getItem('idUsuario')) {
        sessionStorage.removeItem('carrinho');
    }

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
        url: `https://mundodigital.ddns.net:5000/api/Cliente/${lojaCpfCnpj}?Coluna=cnpj`,
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            if (data.bloqueadO_CLI === false) {
                loja_ddns = `${data.weB_DDNS_CLI}:${data.weB_PORTA_CLI}`;
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
            loja = data.loja[0];
            produtos = data.produtos;
            categorias = data.categorias;
            bairrosEntrega = data.bairros;

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
    let pedidoMin = loja.VR_PEDIDO_MIN_EMP || 0;
    app.innerHTML = `
        <div class="container-fluid">
            <div class="row">
                <!-- Barra lateral -->
                <nav id="sidebar" class="col-md-3 col-lg-3 d-md-block bg-light sidebar mb-3">
                    <div class="position-sticky">
                        <div class="sidebar-header text-center py-1">
                            <img src="/fotos/${lojaCpfCnpj}/logo/logo_web.png" onerror="this.src='assets/png/placeholder_logo.png'" id="logoLoja" alt="Logotipo da Loja" class="img-fluid rounded-circle"
                                style="max-width: 140px;">
                            <p class="small pt-2" style="color:#28a745; font-size: 0.9rem; font-weight:500;">Pedido Mínimo:<strong> R$ ${parseFloat(pedidoMin, 10).toFixed(2)}</strong></p>    
                        </div>
                        
                        <div class="sidebar-scroll">
                            <ul class="nav flex-column">
                                <li class="nav-item"><button type="button" class="btn btn-outline-secondary btn-sm categoria-btn ver-todos" style="width: 98%; font-weight: 500;">Ver Todos</button></li>
                                ${categorias.map(categoria => {
        var nomeFormatado = primeiraLetraMaiuscula(categoria.GRUP_DESCRICAO);
        const produtosCategoria = produtos.filter(produto => produto.GRUP_DESCRICAO === categoria.GRUP_DESCRICAO);
        if (produtosCategoria.length > 0) {
            return `<li class="nav-item">
                                                    <button type="button" class="btn btn-outline-secondary btn-sm categoria-btn ver-categoria" style="width: 98%; font-weight: 500;" data-categoria="${categoria.GRUP_DESCRICAO}">
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
    addInitialProducts(produtos, categorias);
}

function addInitialProducts(produtos, categorias) {
    mainSection.innerHTML = `
        <div class="row container-fluid content slide-right" id="loja-container-main">
            <!-- Conteúdo da página de pedidos -->
            ${categorias.map(categoria => {
        var nomeFormatado = primeiraLetraMaiuscula(categoria.GRUP_DESCRICAO);
        const produtosCategoria = produtos.filter(produto => produto.GRUP_DESCRICAO === categoria.GRUP_DESCRICAO).slice(0, 8);
        if (produtosCategoria.length > 0) {
            return `
                        <div id="${nomeFormatado.trim()}" class="row categoria-titulo container-fluid">
                            <h3 id="categoria-${categoria.ID_GRUPO}">${nomeFormatado.trim()}</h3>
                            <div class="ver-mais-top text-center d-flex" >
                            <button class="btn btn-link btn-sm ver-mais" data-categoria="${categoria.GRUP_DESCRICAO}" style="float:left; border:none; font-weight:600; font-size: 1rem; color:#28a745">Ver todos</button>
                        </div>
                        </div>
                        <section class="products__container" style="--items-quantity: 10;">
                        ${produtosCategoria.map(createProductCard).join('')}
                        </section>
                    `;
        }
        return '';
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
        <div class="product-card-box"> 
            <div class="product-card" id="product-${produto.ID_PROD}" data-product-id="${produto.ID_PROD}">
                <div class="product-image">
                    <span>
                        <div class="product-card-image__overlay"></div>
                        <img src="/fotos/${lojaCpfCnpj}/${produto.ID_PROD}/${produto.ID_PROD}_0_thumb.jpg" loading="lazy" onerror="this.src='${imgOnError}'" alt="COD-${produto.ID_PROD}">
                    </span>
                    <button class="add-to-cart-btn">✚</button>
                </div>
                <div class="product-info">
                    <div class="product-name">${nomeFormatado.trim()}</div>
                    <div class="product-description">Short description</div>
                    <div class="product-price">R$ ${produto.VR_VENDA3_ESTOQUE.toFixed(2)}</div>
                </div>
            </div>
        </div>
        `;
}

function addMoreProducts(categoria) {
    mainSection.scrollTop = 0;
    sidebarScroll.scrollTop = 0;
    var contentElement = document.getElementById('loja-container-main');
    contentElement.classList.add('slide-right');
    var btnVoltar = `<div class="text-center mt-2" style="width: 100%;">
                        <button class="btn btn-link btn-sm voltar-todos" style="float:left;border:none;font-size: 1rem; font-weight:600; color:#28a745;">◁ Voltar</button>
                    </div> `
    var categoriaElement = `<div id="${categoria}" class="row categoria-titulo container-fluid" style="margin-top:5px;">
                                <h3 style="width: 100%;"}">${primeiraLetraMaiuscula(categoria)}</h3>
                            </div>`;
    contentElement.innerHTML = "";
    contentElement.innerHTML += btnVoltar;
    contentElement.innerHTML += categoriaElement;
    categoriaElement = document.getElementById(`${categoria}`);
    var produtosCategoria = produtos.filter(produto => produto.GRUP_DESCRICAO === categoria);
    contentElement.innerHTML += produtosCategoria.map(createProductCard).join('');
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        card.style.marginRight = '25px';
    });

    contentElement.classList.add('slide-left');
    setTimeout(function () {
        contentElement.classList.remove('slide-right');
        contentElement.classList.remove('slide-left');
    }, 500);

}

function backToInitialView() {
    mainSection.scrollTop = 0;
    sidebarScroll.scrollTop = 0;
    var contentElement = document.getElementById('loja-container-main');
    contentElement.classList.remove('slide-left');

    addInitialProducts(produtos, categorias);
    toggleSidebar();
}

document.addEventListener('click', function (event) {
    if (event.target.classList.contains('ver-mais') || event.target.classList.contains('ver-categoria')) {
        const categoria = event.target.getAttribute('data-categoria');
        addMoreProducts(categoria);
    }
});

document.addEventListener('click', function (event) {
    const voltarTodosBtn = $('.voltar-todos');
    if (event.target.classList.contains('ver-todos') || event.target.classList.contains('voltar-todos')) {
        if (voltarTodosBtn.length == 0) {
            mainSection.scrollTop = 0;
            sidebarScroll.scrollTop = 0;
        } else {
            backToInitialView();
        }
    }
});

function primeiraLetraMaiuscula(texto) {
    var ignoredWords = ["de", "da", "do", "das", "dos", "para", "com", "em", "por", "sem", "o", "os", "a", "as", "e"];
    var palavras = texto.toLowerCase().split(" ");
    for (var i = 0; i < palavras.length; i++) {
        if (!ignoredWords.includes(palavras[i]) || i === 0) {
            palavras[i] = palavras[i].charAt(0).toUpperCase() + palavras[i].slice(1);
        }
    }
    return palavras.join(" ");
}

function getColor() {
    var image = document.getElementById('logoLoja');

    $(image).on('load', function () {
        var colorThief = new ColorThief();

        var colors = colorThief.getPalette(image, 2);

        var cor1 = 'rgb(' + colors[0][0] + ',' + colors[0][1] + ',' + colors[0][2] + ')';
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

toggleSidebar();

$(window).resize(function () {
    toggleSidebar();
});

$(document).on('click', '#sidebarToggle', function () {
    $("#sidebar").toggleClass("active");
    $("#sidebarToggle").toggleClass("active");
});

$(document).on('click', '.categoria-btn', function () {
    $("#sidebar").removeClass("active");
    $("#sidebarToggle").removeClass("active");
});

$(document).on('click', '.product-card', function () {

    const productId = $(this).closest('.product-card').data('product-id');
    console.log("esse é o id do produto clicado para comprar:", productId);

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
    $(popupSelector).find('.modal-title').text(product.NOME_PROD);


    $('#carouselInner').empty();


    loadCarouselImages(product.ID_PROD, lojaCpfCnpj);

    $(popupSelector).find('.modal-body').html(`
        <p class="m-0 p-0 text-right" style="font-size:xx-small"><i>*Imagens meramente ilustrativas</i></p>        
        <p style="font-size:x-small"><i><strong>Descrição:</strong>${product.OBS_PROD}</i></p>
        <p id="productPrice" style="color:green; font-weigth:strong;">R$ ${product.VR_VENDA3_ESTOQUE.toFixed(2)}</p>
        <div class="row pl-3">
            <label for="quantidade">Quantidade:</label>        
            <form class="quantity ml-2">
                <input type="button" value="━" data-index="0" class="btn-outline-danger qtyminus minus p-0 m-0" field="quantity" style="width: 25px">
                <input type="number" id="quantidadeProduto" name="quantidade" value="1" min="0" max="${product.QTD_ATUAL_ESTOQUE - qtdCarrinho}" data-index="0" class="qty p-0 m-0" data-product-id="${product.ID_PROD}">
                <input type="button" value="✚" data-index="0" class="btn-outline-primary qtyplus plus p-0 m-0" field="quantity" style="width: 25px">
            </form>
        </div>
        <p class="m-0" style="font-size:0.8rem;">Estoque: ${product.QTD_ATUAL_ESTOQUE - qtdCarrinho}</p>
        <p class="m-0" id="qtdCarrinho" style="font-size:0.7rem; font-weight:bold; display:none">Adicionado na Sacola: ${qtdCarrinho}</p>
        
    `);
    if (qtdCarrinho > 0) {
        $('#qtdCarrinho').show();
    }
    if (product.QTD_ATUAL_ESTOQUE - qtdCarrinho == 0) {
        $('#addToCartButton').attr('disabled', true);
        $('#quantidadeProduto').val('0')
    } else {
        $('#addToCartButton').attr('disabled', false);

    }

    $(popupSelector).modal('show');
}

function loadCarouselImages(productCode, lojaCpfCnpj) {
    const carouselIndicators = document.getElementById('carousel-indicators');
    const carouselInner = document.getElementById('carousel-inner');

    carouselIndicators.innerHTML = '';
    carouselInner.innerHTML = '';

    for (let i = 0; i < 10; i++) {
        const imageUrl = `/fotos/${lojaCpfCnpj}/${productCode}/${productCode}_${i}_web.jpg`;

        const indicator = document.createElement('li');
        indicator.setAttribute('data-target', '#carouselExampleIndicators');
        indicator.setAttribute('data-slide-to', i);
        if (i === 0) {
            indicator.classList.add('active');
        }
        carouselIndicators.appendChild(indicator);

        const carouselItem = document.createElement('div');
        carouselItem.classList.add('carousel-item');
        if (i === 0) {
            carouselItem.classList.add('active');
        }

        const img = document.createElement('img');
        img.classList.add('d-block', 'w-100');
        img.src = imageUrl;
        img.alt = `Imagem ${i + 1}`;
        img.onerror = function () { handleImageError(this, i); };
        carouselItem.appendChild(img);

        carouselInner.appendChild(carouselItem);
    }
}

function handleCarouselImageError(imageElement, index) {
    const carouselItem = imageElement.parentElement;
    const indicatorItem = document.querySelector(`[data-slide-to="${index}"]`);

    if (carouselItem) carouselItem.remove();
    if (indicatorItem) indicatorItem.remove();

    const activeItems = document.querySelectorAll('.carousel-item.active');
    if (activeItems.length === 0) {
        const nextItem = document.querySelector('.carousel-item');
        if (nextItem) nextItem.classList.add('active');
    }

    const indicators = document.querySelectorAll('.carousel-indicators li');
    indicators.forEach((indicator, idx) => {
        indicator.setAttribute('data-slide-to', idx);
    });
}
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
    var produtosCategoria = produtos.filter(produto => produto.NOME_PROD.toUpperCase().indexOf(filterValue) > -1);
    contentElement.innerHTML += produtosCategoria.map(createProductCard).join('');
    $(".svg-search-loading").css("display", "none");

}

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


let carrinho = sessionStorage.getItem('carrinho');
let cliente;
if (!carrinho) {
    carrinho = [];
} else {
    carrinho = JSON.parse(carrinho);
}

function atualizarIndicadorCarrinho() {
    var $carrinhoBadge = $('#carrinho-badge');

    if (carrinho) {
        var numeroItens = carrinho.length;

        $carrinhoBadge.text(numeroItens);
    } else {
        $carrinhoBadge.text('');
    }
}

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


$(document).on('click', '#addToCartButton', function () {

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
    const existingProductIndex = carrinho.findIndex(item => item.id === productId);
    if (existingProductIndex !== -1) {
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
        carrinho.push(produto);
    }

    sessionStorage.setItem('carrinho', JSON.stringify(carrinho));

    atualizarExibicaoCarrinho();
    $('#productModal').modal('hide');

    $('#confirmacaoModal').modal('show');


    $('#sacolaButton').on('click', function () {
        $("input[name='opcaoEntrega']").prop("checked", false);
        $('#taxaEntrega').hide();
        $("#taxa-entrega").text('0.00');
        atualizarExibicaoCarrinho();
    });

    $('#abrirSacolaBtn').on('click', function () {
        $("input[name='opcaoEntrega']").prop("checked", false);
        $('#taxaEntrega').hide();
        $("#taxa-entrega").text('0.00');
        atualizarExibicaoCarrinho();
        $('#confirmacaoModal').modal('hide');

        $('#sacolaModal').modal('show');
    });

});

function atualizarExibicaoCarrinho() {
    carrinho = JSON.parse(sessionStorage.getItem('carrinho'));
    if (!carrinho) {
        carrinho = [];
    }
    atualizarIndicadorCarrinho();
    const carrinhoSelector = '#sacolaLista';

    if (carrinho.length === 0) {
        $('#finalizarCompra').hide();
        $('#sacolaVazia').show();
    } else {
        $('#finalizarCompra').show();
        $('#sacolaVazia').hide();
    }


    let total = 0;

    carrinho.forEach((product, index) => {
        const precoFormatado = product.preco !== null ? product.preco : 0;
        product.precoTotal = precoFormatado * product.quantidade;

        const produtoHTML = `
            <div class=" cardmb-1" id="produto-${product.id}" style="border:none; border-bottom: 1px solid rgba(0, 0, 0, .125); border-radius:0;">
                <div class="card-body p-1">
                    <div class="row">
                        <div class="col-0 col-sm-2 col-md-2 d-none d-sm-block">
                            <img src=/fotos/${lojaCpfCnpj}/${product.id}/${product.id}_0_thumb.jpg onerror="this.src='assets/jpg/placeholder_thumb.jpg'" alt="${product.id}" class="img-thumbnail" style="max-width: 50px; max-height: 50px;">
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
                            <button class="btn px-2 py-0 m-0 remover-produto" data-index="${index}">
                                <i class="fa fa-trash" style="color: crimson; position:inherit"></i>
                            </button>                                            
                        </div>
                    </div>
                </div>
            </div>
        `;

        const existingProduct = $(`${carrinhoSelector} #produto-${product.id}`);
        if (existingProduct.length) {
            existingProduct.replaceWith(produtoHTML);
        } else {
            $(carrinhoSelector).append(produtoHTML);
        }

        if (product.preco !== null) {
            total += product.preco * product.quantidade;
        }
    });

    $(".sacolaTotal").empty();
    $(".sacolaTotal").append(`

                <div class="btn btn-light disabled" disabled>
                    <strong>Total: R$ <span id="total-carrinho">${total.toFixed(2)}</span></strong>
                </div>
    `);
}

atualizarExibicaoCarrinho();

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

        atualizarExibicaoCarrinho();
    } else {
        const index = $(this).data('index');
        const confirmacao = confirm('Deseja realmente remover este produto do carrinho?');

        if (confirmacao) {
            const produtoRemover = $(`#sacolaLista #produto-${carrinho[index].id}`);
            carrinho.splice(index, 1);
            sessionStorage.setItem('carrinho', JSON.stringify(carrinho));
            produtoRemover.remove();
            atualizarExibicaoCarrinho();
        } else {
            $(this).val(1);
        }
    }
});

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



$(document).on('click', '.remover-produto', function () {
    const index = $(this).data('index');
    const confirmacao = confirm('Deseja realmente remover este produto do carrinho?');
    if (confirmacao) {
        const produtoRemover = $(`#sacolaLista #produto-${carrinho[index].id}`);
        carrinho.splice(index, 1);
        sessionStorage.setItem('carrinho', JSON.stringify(carrinho));
        produtoRemover.remove();
        atualizarExibicaoCarrinho();
    }

});

atualizarExibicaoCarrinho();

$(document).on('click', '#finalizarCompra', function () {
    if (!loja.OPERANDO_EMP) {
        $('#finalizarPedidoModal').modal('hide');
        alert('No momento não estamos aceitando pedidos pelo site.')
        return;
    }
    $('#finalizarPedidoModal').modal('show');
    $('#telefone').val(formatTelefone(telefoneCliente));
    checkClienteByTelefone($('#telefone').val(), lojaID)
});


$(document).on('click', '#voltarSacola', function () {
    $('#sacolaModal').modal('show');
});



$('#telefone').on('input', function () {
    const telefone = $(this).val().replace(/\D/g, '');

    if (telefone.length === 11) {
        checkClienteByTelefone($(this).val(), lojaID);
    }
});

var idRadioSelecionado = null;
function checkClienteByTelefone(telefone, id) {

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

                function formatarEndereco(endereco) {
                    return `<p class='m-0' id='endereco_${endereco.ID_CLI_END}'><span class='endereco-salvo-rua'>${endereco.RUA_CLI_END},</span> n° <span class='endereco-salvo-numero'>${endereco.NUMERO_CLI_END}</span></p>
                    <p class='m-0'><span class='endereco-salvo-bairro' data-bairro-id="${endereco.ID_BAIRRO_CLI_END}">${endereco.NOME_BAIRRO.trim()}</span> - <span class='endereco-salvo-cidade'>${endereco.NOME_CID}</span></p>`;
                }

                enderecos.forEach(function (endereco, index) {
                    var enderecoFormatado = formatarEndereco(endereco);
                    var radioId = `enderecoRadio${index}`;
                    var taxaBairro = endereco.VR_FRETE_BAIRROQ;

                    var labelCard = $(`
                        <label class="form-check-label m-1" for="${radioId}">
                            <div class="card">
                                <div class="card-body p-2 small">
                                    <h6 class="card-title">Endereço ${index + 1}</h6>
                                    ${enderecoFormatado}
                                    <div class="flex-box">
                                        <a href="#" class="btn-excluir-endereco p-0" style="display:none; float:left; color:black">Excluir</a>
                                        <a href="#" class="btn-editar-endereco p-0" style="display:none; float:right;">Editar</a>
                                    </div>
                                </div>
                            </div>
                        </label>
                    `);

                    var radioOption = $(`<div class="endereco-card form-check form-check-inline"></div>`)
                        .append($(`<input class="form-check-input enderecoPadrao" type="radio" name="opcaoEndereco" id="${radioId}" data-id-endereco="${endereco.ID_CLI_END}" data-taxa-endereco="${taxaBairro}" value="enderecoSalvo">`))
                        .append(labelCard);

                    $("#listaEnderecos").append(radioOption);
                });



                $("#listaEnderecos").append($(enderecoNovo));

            } else {
                $('#enderecoPadraoCard').hide();
                listaEnderecos.empty();
                $("#listaEnderecos").append($(enderecoNovo));

            }

            document.getElementById("loadingPopup").style.display = "none";
        },
        error: function (error) {
            console.log('Erro na solicitação AJAX: ' + error);

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

    bairrosDaCidade.forEach(function (bairro) {
        dropdownBairros.append(`<option value= "${bairro.ID_BAIRRO}" data-nome-bairro="${bairro.NOME_BAIRRO.trim()}">${bairro.NOME_BAIRRO.trim()}</option>`)
    });

    dropdownBairros.on("change", function () {
        $("#dropdownBairros").removeClass("is-invalid");

        var selectedBairroId = $(this).val();


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

    dropdownCidades.empty();
    dropdownCidades.append('<option value="">Selecione uma cidade</option>');


    cidades.forEach(function (cidade) {
        dropdownCidades.append('<option value="' + cidade.ID_CIDADE + '">' + cidade.NOME_CIDADE.trim() + '</option>');
    });

    dropdownCidades.on('click', function () {
        $(this).find("option").show();
    });
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
        numeroTelefone = $(telefone).val().replace(/\D/g, '');
    }


    if (numeroTelefone.length === 11) {
        numeroTelefone = numeroTelefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        $('#retirada').prop('disabled', false);
        $('#entrega').prop('disabled', false);

    } else {
        $('#retirada').prop('disabled', true);
        $('#entrega').prop('disabled', true);
        $("#retirada").prop("checked", true).change();
    }

    telefone.value = numeroTelefone;

    return numeroTelefone;
}

$(document).on('click', '#continuarEndereco', function () {
    const telefone = $('#telefone').val();
    const nome = $('#nome').val();

    if (telefone.length !== 15) {
        alert("Telefone inválido. Deve conter 11 dígitos.");
        $("#telefone").addClass("is-invalid");
        return;
    } else {
        $("#telefone").removeClass("is-invalid");
    }

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
    if (!cliente) {
        checkClienteByTelefone($('#telefone').val(), lojaID);
    }
    $('#finalizarPedidoModal').modal('hide');
    $('#enderecoPedidoModal').modal('show');

});

$(document).on('click', '#continuarEndereco', function () {
    $('#finalizarPedidoModal').modal('show');

});

$('input[name="opcaoEntrega"]').on('change', function () {
    const opcaoSelecionada = $(this).val();

    if (opcaoSelecionada === 'retirada') {

        $('#opcoesEndereco').hide();
        $('#enderecoCliente').hide();
        $('#taxaEntrega').hide();
        $("#taxa-entrega").text('0.00');

        $("input[name='opcaoEndereco']:checked").prop("checked", false);

        $('#lojaCard').show();

        const enderecoLoja = `${loja.RUA_EMP + ', ' + loja.NUMERO_EMP}<br>${loja.BAIRRO_EMP} - ${loja.NOME_CID}`
        $('#lojaEndereco').html(enderecoLoja);
        atualizarExibicaoCarrinho();
    } else if (opcaoSelecionada === 'entrega') {
        $('#lojaCard').hide();
        $('#opcoesEndereco').show();
        atualizarExibicaoCarrinho();
    } else {
        $('#lojaCard').hide();
        $('#opcoesEndereco').show();
    }
});

$('#listaEnderecos').on('change', 'input[name="opcaoEndereco"]', function () {

    $('input[name="opcaoEntrega"][value="entrega"]').prop('checked', true);
    const opcaoSelecionada = $(this).val();

    if (opcaoSelecionada === 'enderecoSalvo') {
        $('#enderecoCliente').hide();

    } else if (opcaoSelecionada === 'enderecoNovo') {
        $('#enderecoCliente').show();

    } else {
        $('#lojaCard').hide();
        $('#opcoesEndereco').hide();

    }
});

$('#formaPagamento').on('change', function () {
    const formaPagamentoSelecionada = $(this).val();

    if (formaPagamentoSelecionada === '1') {
        $('#trocoDiv').show();
    } else {
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

$('#continuarPagamento').click(async function () {

    const telefone = $('#telefone').val();
    const nome = $('#nome').val();
    const clienteID = cliente.length === 0 ? null : cliente[0].ID_CLI;
    const escolhaEntrega = $('input[name=opcaoEntrega]:checked').val() === 'entrega' ? 1 : 0;
    const escolhaEndereco = $('input[name=opcaoEndereco]:checked').val() === 'enderecoSalvo' ? 1 : 0;
    const rua = escolhaEntrega == 1 ? $('#rua').val() : loja.RUA_EMP;
    const numero = escolhaEntrega == 1 ? $('#numero').val() : loja.NUMERO_EMP;
    const complemento = $('#complemento').val();
    const bairro = escolhaEntrega == 1 ? $("#dropdownBairros").val() : loja.BAIRRO_EMP;
    const cidade = escolhaEntrega == 1 ? $("#dropdownCidades").val() : loja.ID_CIDADE_EMP;
    const endereco = $('input[name=opcaoEndereco]:checked').data('id-endereco') || null;
    let taxa = 0;

    const opcaoEntrega = $('input[name="opcaoEntrega"]:checked');
    if (!opcaoEntrega.length) {
        alert("Selecione uma opção de entrega ou retirada.");
        return;
    }

    if (opcaoEntrega.val() === "entrega") {
        let rua;
        let numero;
        let cidade;
        let bairroID;
        let bairro;
        let uf;
        const opcaoEndereco = $('input[name="opcaoEndereco"]:checked');
        if (!opcaoEndereco.length) {
            alert("Selecione um endereço padrão ou escolha um novo endereço.");
            return;
        }

        if (opcaoEndereco.val() === "enderecoNovo") {
            bairroID = $("#dropdownBairros").val();
            dadosBairro = dadosBairroSelecionado(bairroID);
            rua = $("#rua").val();
            numero = $("#numero").val();
            bairro = dadosBairro[0].NOME_BAIRRO;
            cidade = dadosBairro[0].NOME_CID;
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
        } else {
            var selectedRadio = $('input[name="opcaoEndereco"]:checked');
            var parentDiv = selectedRadio.next();
            rua = parentDiv.find('.endereco-salvo-rua').text().trim().replace(',', '');
            numero = parentDiv.find('.endereco-salvo-numero').text().trim();
            bairroID = parentDiv.find('.endereco-salvo-bairro').data('bairro-id');
            bairro = parentDiv.find('.endereco-salvo-bairro').text().trim();
            cidade = parentDiv.find('.endereco-salvo-cidade').text().trim();
        }

        try {
            document.getElementById("loadingPopup").style.display = "flex";

            if (loja.CHAVE_KEY_MACHINE_EMP) {
                uf = await getUfByAddress(rua, numero, bairro, cidade);

                const apiResponse = await getFrete(lojaID, true, rua, numero, cidade, bairro, uf);

                if (apiResponse.success) {
                    taxa = apiResponse.response.estimativa_valor
                } else {
                    let dadosBairro = dadosBairroSelecionado(bairroID);
                    taxa = parseFloat(dadosBairro[0].VR_FRETE_BAIRROQ);
                }
            } else {
                let dadosBairro = dadosBairroSelecionado(bairroID);
                taxa = parseFloat(dadosBairro[0].VR_FRETE_BAIRROQ);
            }

            let subTotal = parseFloat($('#total-carrinho')[0].innerText);
            let total = taxa + subTotal;

            $(".sacolaTotal").empty();
            $(".sacolaTotal").append(`

                <div class="btn btn-light disabled" style="text-align:left;" disabled>
                    <p class="m-1">Produtos: R$ <span>${subTotal.toFixed(2)}</span></p>
                    <p class="m-1">Entrega: R$ <span>${taxa.toFixed(2)}</span></p>
                    <p class="m-1"><strong>Total: R$ <span id="total-carrinho">${total.toFixed(2)}</span></strong></p>
                </div>
            `);

        } catch (error) {
            console.error("Erro ao obter frete:", error);
            document.getElementById("loadingPopup").style.display = "none";
            return;
        }

    }

    const dadosCliente = {
        clienteID,
        telefone,
        nome,
        escolhaEntrega,
        escolhaEndereco,
        taxa,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        endereco
    };
    sessionStorage.setItem('dadosCliente', JSON.stringify(dadosCliente));

    $('#enderecoPedidoModal').modal('hide');
    document.getElementById("loadingPopup").style.display = "none";
    $('#escolherPagamentoModal').modal('show');
});

async function getUfByAddress(street, number, neighborhood, city) {
    var address = `${number} ${street}, ${neighborhood}, ${city}, Brazil`;
    var apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    let uf;
    await $.ajax({
        url: apiUrl,
        method: 'GET'
    }).then(function (response) {
        if (response.length > 0) {
            var display_name = response[0].display_name;
            var addressParts = display_name.split(', ');
            uf = addressParts[addressParts.length - 4];
        } else {
            uf = null
        }
    }).catch(function (error) {
        console.error('Erro ao consultar o endereço:', error);
        throw error;
    });

    return uf;
}

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
    atualizarExibicaoCarrinho();
    $('#enderecoPedidoModal').modal('show');
});

$('#confirmarPedido').click(function (e) {
    var pedidoMin = parseFloat(loja.VR_PEDIDO_MIN_EMP);
    var totalCarrinho = parseFloat($('#total-carrinho')[0].innerText);

    if (pedidoMin > totalCarrinho) {
        alert(`O valor dos produtos deve ser superior ao pedido mínimo de R$ ${parseFloat(loja.VR_PEDIDO_MIN_EMP).toFixed(2)}`)
        return;
    }

    const formaPagamento = $('#formaPagamento').val();
    if (!formaPagamento) {
        alert('Por favor, selecione uma forma de pagamento.');
        return;
    }

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
    verificarEstoqueEChecarPedido();

});

async function getFrete(IdEmp, RetornaEmpresa, EnderecoDestino, NumeroDestino, cidadeDestino, bairroDestino, uf) {
    var url = `https://mundodigital.ddns.net:5000/api/EmpresaPremium/${IdEmp}/${RetornaEmpresa}/${EnderecoDestino}/${NumeroDestino}/${cidadeDestino}/${bairroDestino}/${uf}`;

    try {
        const response = await $.ajax({
            url: url,
            type: 'GET'
        });
        console.log("API Response:", response);
        return response;
    } catch (error) {
        console.error("Erro na chamada da API:", error);
        throw error;
    }
}

function enviarPedidoAPI() {
    const dadosCliente = JSON.parse(sessionStorage.getItem('dadosCliente'));
    const precoTotal = parseFloat($('#total-carrinho').text()) - dadosCliente.taxa;
    const formaPagamento = $('#formaPagamento').val();
    const troco = $('#troco').val();
    const observacao = $('#observacao').val();

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
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dadosParaEnviar),
        success: function (response) {
            if (response.confirmado) {
                document.getElementById("loadingPopup").style.display = "none";
                sessionStorage.removeItem('carrinho');
                dadosParaEnviar = [];
                cliente = undefined;
                atualizarExibicaoCarrinho();
                alert('Pedido enviado com sucesso! Você receberá atualizações sobre seu pedido pelo WhatsaApp informado');
                location.reload();
            } else {
                document.getElementById("loadingPopup").style.display = "none";
                alert('Ocorreu um erro no envio do pedido.');
            }
        },
        error: function (error) {
            document.getElementById("loadingPopup").style.display = "none";

            console.log('Erro na solicitação AJAX: ' + error);
            alert('Ocorreu um erro no envio do pedido. Tente novamente');
            location.reload();
        }
    });
}

async function verificarEstoqueEChecarPedido() {
    const carrinho = JSON.parse(sessionStorage.getItem('carrinho'));
    const productCodes = carrinho.map(item => item.id);

    try {
        const response = await $.ajax({
            url: 'https://mundodigital.ddns.net:3000/api/checar-estoque',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ codes: productCodes })
        });

        let estoqueInsuficiente = false;

        carrinho.forEach(item => {
            const estoqueAtual = response[item.id];
            if (item.quantidade > estoqueAtual) {
                item.quantidade = estoqueAtual;
                estoqueInsuficiente = true;
            }

            if (estoqueAtual === 0) {
                const index = carrinho.findIndex(cartItem => cartItem.id === item.id);
                if (index !== -1) {
                    carrinho.splice(index, 1);
                }
            }
        });

        if (estoqueInsuficiente) {
            alert(`Alguns produtos sofreram alteração no estoque. Por favor revise o seu carrinho de compras. \n Obs: Produtos com estoque zerados serão removidos do carrinho`);

            sessionStorage.setItem('carrinho', JSON.stringify(carrinho));
            atualizarExibicaoCarrinho();
            $('#escolherPagamentoModal').modal('hide');
            document.getElementById("loadingPopup").style.display = "none";
            $('#sacolaModal').modal('show');
        } else {
            document.getElementById("loadingPopup").style.display = "flex";
            enviarPedidoAPI();
            $('#escolherPagamentoModal').modal('hide');
        }
    } catch (error) {
        console.error('Erro ao verificar estoque:', error);
        alert('Erro ao verificar estoque. Por favor, tente novamente.');
    }
}

const checkStatus = async () => {
    try {
        if (!lojaID) {
            return;
        };

        const response = await $.ajax({
            url: `https://mundodigital.ddns.net:3000/api/status?id=${lojaID}`,
            method: 'GET'
        });

        if (response.status === false) {
            if ($('#avisoFechado').is(':hidden')) {
                alert('Desculpe, essa loja parou de aceitar pedidos nesse momento');
                location.reload();
            }
        } else {
            if ($('#avisoFechado').is(':visible')) {
                location.reload();
            } else {
                //$('#status-result').append(`<p>Company Status: ${response.status}</p>`);
            }
        }
    } catch (error) {
        console.error('Error:', error); //alert('Erro ao buscar status da loja. Recarregue a página por favor.');
        location.reload();
    }
};

function dadosBairroSelecionado(id) {
    dadosBairro = $.grep(bairrosEntrega, function (bairro) {
        return bairro.ID_BAIRRO == id;
    });
    return dadosBairro;
}

setInterval(checkStatus, 10000);

checkStatus();