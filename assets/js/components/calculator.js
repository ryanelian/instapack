'use strict';

require('angular').module('aspnet').component('calculator', {
    templateUrl: 'calculator.html',
    controller: function () {
        var me = this;
        me.A = 1;
        me.B = 1;
    },
    controllerAs: 'me'
});
