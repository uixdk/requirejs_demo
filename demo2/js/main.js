require.config({
  baseUrl: 'js'
});

require(['selector'], function(query){
  var els = query('.wrapper');
  console.log(els);
});