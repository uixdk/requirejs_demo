require.config({
  paths:{
    jquery: 'jquery-1.7.1'
  }
});

require(['jquery'], function($){
  alert($().jquery);
});