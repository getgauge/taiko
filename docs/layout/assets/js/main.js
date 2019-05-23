$(document).ready(function() {
  init();
  setTimeout(function(){
    onLoad();
  },100);

  var $window = $(window);
  $('.collapsible-header a').click(function(){
      if($(this).attr('aria-expanded') == "false") {
          $(this).find('.collapse-icon').text('-')
      }else {
          $(this).find('.collapse-icon').text('+')
      }
  });

  $('.sidebar-menu').click(function() {
    $('.sidebar').toggleClass('sidebar-show ');
  });

  
  $('.sidebar-header-2 a').click(function() {
    if($window.width() < 991){
      $('.sidebar').toggleClass('sidebar-show ');
    };
  });
  
  
  $sidebar = $('.sidebar');
  $window.resize(function resize(){
    if ($window.width() < 991) {
        return $sidebar.removeClass('sidebar-show');
    }

  }).trigger('resize');


  
    $('#search').focusin(function(){
      $('.search-label').fadeOut(500);
    });

    $('#search').focusout(function(){
      $('.search-label').fadeIn(500);
    });
    

    $(window).scroll(function() {
      if ($(this).scrollTop() >= 10) {      
          $('.scroll-top').fadeIn(200);    
      } else {
          $('.scroll-top').fadeOut(200); 
      }
    });
    
    $('.scroll-top').click(function() {    
      $('body,html').animate({
          scrollTop : 0 
      }, 500);
    });
});


function gitHubStars(){
  $.ajax({
    url: "https://api.github.com/repos/getgauge/taiko",
    success: function(data){
      if(data['stargazers_count'] != undefined){
        $('.github-count').text(data['stargazers_count']);
        window.localStorage.setItem('star',data['stargazers_count']);
      }
    }
  })
}

function setGithubStar(){
  gitHubStars();
  var star = window.localStorage.getItem('star')
  $('.github-count').text(star);
}


function scrollHightlight(element) {
  var $headers = $(element);

  $(window).scroll(function(){  
    var currentScroll = $(this).scrollTop();
    var $currentSection

    $headers.each(function(){
      var divPosition = $(this).offset().top - 100;
      if( divPosition - 1 < currentScroll ){
        $currentSection = $(this);
      }
      if($currentSection.attr('id')){
        var id = $currentSection.attr('id');
      }

      $('.sidebar-header-2 a').removeClass('active');
      id = "'#" + id + "'";
      $(".sidebar-header-2 [href=" + id + "]").addClass('active');
    })
  });
}


function copyCode(element) {
  $(element).each(function() { 
    $(this).append("<button class='copyBtn'>Copy</button>");
    $(this).append("<input class='codeBox' value='none'> </input>");
    $(this).append('<span class="copied-text">copied</span>');
  });

  $('.copyBtn').click(function() {
    var value = $(this).prev().text();
    var $copied_text = $(this).nextAll('.copied-text');
    codeBox = $(this).next();
    codeBox.val(value);
    codeBox.select();
    document.execCommand('copy');
    $($copied_text).fadeIn();
    setTimeout(function() {
      $($copied_text).fadeOut();
    }, 3000);
  });
}


function appendLink(elements) {
  elements.each(function() {
    var id = '#' + $(this).attr('id');
    $(this).append("<a href="+ id +" class='link-icon'></a>");
  })
}


function smoothScroll() {
  $(".sidebar-header-2 a, .link-icon").on('click', function(event) {
    if (this.hash !== "") {
      event.preventDefault();
      var hash = this.hash;
      $('.headbutt_blocker').removeClass('show');
      $(hash).find('.headbutt_blocker').addClass('show');
      $('.link-icon').removeClass('pull-down');
      $(hash).find('.link-icon').addClass('pull-down');
      $('html, body').animate({
        scrollTop: $(hash).offset().top
      }, 800, function(){
        window.location.hash = hash;
      });
    };
  }); 
}

function alogoliaSearch() {
  docsearch({ 
    apiKey: 'b36d75c493b44a8f2605db66708a283b', 
    indexName: 'taiko', 
    inputSelector: '#search', 
    algoliaOptions: { 'facetFilters': ['tags:preview'] },
    debug: false // Set debug to true if you want to inspect the dropdown 
    }); 
}

function headButtresolve(element) {
  $(element).prepend('<span class="headbutt_blocker"></span>')
}

function updateDollarLink() {
    let link = document.evaluate('//h2[string() = "$"]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    link.id = 'dollar';
    link.children[1].setAttribute('href', '#dollar');

    let reference = document.querySelector('#Selectors > li:nth-child(1) > a');
    reference.setAttribute('href', '#dollar');
}


function onLoad(){
  var hash = window.location.hash;
  if (hash !== "") {
    $('.headbutt_blocker').removeClass('show');
    $(hash).find('.headbutt_blocker').addClass('show');
    $('.link-icon').removeClass('pull-down');
    $(hash).find('.link-icon').addClass('pull-down');
    $('html, body').animate({
      scrollTop: $(hash).offset().top
    }, 1000);
  }
}

function init() {
  document.querySelectorAll('div.content-section pre').forEach((block) => {
    hljs.highlightBlock(block);
  });
  setGithubStar();
  setTimeout(function(){
    smoothScroll();
  }, 100);
  alogoliaSearch();
  appendLink($('.main-content h2'));
  appendLink($('.main-content h3'));
  headButtresolve($('.banner-heading'));
  headButtresolve($('section h2'));
  headButtresolve($('.sub-section h3'));
  headButtresolve($('.content-section h2'));
  copyCode($('.content-section .hljs'));
  copyCode($('.code-section .hljs'));
  scrollHightlight('section h2');
  scrollHightlight('.sub-section h3');
  scrollHightlight('.content-section h2');
  updateDollarLink();
}