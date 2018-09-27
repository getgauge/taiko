$(document).ready(function() {
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

});