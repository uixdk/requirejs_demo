require.config({
    baseUrl: 'js',
    paths:{
        jquery: 'jquery-1.7.1'
    }
});

require(['jquery', 'selector','event'], function($, S, E){
    alert('page2');
    var els = $('p');
    for(var i=0; i<els.length; i++){
        E.bind(els[i], 'click', function(){
            alert(this.innerHTML);
        });
    }
});