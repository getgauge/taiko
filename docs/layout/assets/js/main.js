$(document).ready(function() {
  scrollHightlight('section');
  scrollHightlight('.content-section h2');
  copyCode();
  setGithubStar();

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


  docsearch({ 
    apiKey: 'b36d75c493b44a8f2605db66708a283b', 
    indexName: 'taiko', 
    inputSelector: '#search', 
    debug: false // Set debug to true if you want to inspect the dropdown 
    }); 

    $('#search').focusin(function(){
      $('.search-label').fadeOut(500);
    });

    $('#search').focusout(function(){
      $('.search-label').fadeIn(500);
    });
    

    $(window).scroll(function() {
      if ($(this).scrollTop() >= 50) {      
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
        window.localStorage.setItem('star',data['stargazers_count'])
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
      var divPosition = $(this).offset().top;
      if( divPosition - 1 < currentScroll ){
        $currentSection = $(this);
      }
      var id = $currentSection.attr('id');
      $('a').removeClass('active');
      id = "'#" + id + "'";
      $("[href=" + id + "]").addClass('active');
    })
  });
}


function copyCode() {
  $('.content-section .hljs').each(function() { 
    $(this).append("<button class='copyBtn'>Copy</button>");
    $(this).append("<input class='codeBox' value='none'> </input>")
  });

  $('.copyBtn').click(function() {
    var value = $(this).prev().text();
    codeBox = $(this).next();
    codeBox.val(value);
    codeBox.select();
    document.execCommand('copy');
  });
}

