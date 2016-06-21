'use strict';


var resumeApp = resumeApp || {};

// Fix orientation scaling bug (http://stackoverflow.com/questions/2557801)
if (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i)) {
    var viewportmeta = document.querySelector('meta[name="viewport"]');
    if (viewportmeta) {
        viewportmeta.content = 'width=device-width, minimum-scale=1.0, maximum-scale=1.0, initial-scale=1.0';
        document.body.addEventListener('gesturestart', function() {
            viewportmeta.content = 'width=device-width, minimum-scale=0.25, maximum-scale=1.6';
        }, false);
    }
}


// Start the WOW animation instance
resumeApp.wowInstance = new WOW();
resumeApp.wowInstance.init();

// Start the game of life
resumeApp.gameInstance = new GameOfLife({
    canvasId: 'gameOfLifeTarget'
    , cellSize: 3
    , ratioAlive: 0.12
    , maxCircleRadius: 50
    , circleDropThreshold: 0.5
    , cycleColors: false
    , color: '#d3d3d3'
    , keepAlive: true
});
resumeApp.gameInstance.run();

resumeApp.message = {
    isValid: function(nameInput, emailInput, messageInput) {
        var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        var isValid = true;

        // Validate name input
        if (nameInput.value) {
            this.removeErrorFromInput(nameInput);
        } else {
            isValid = false;
            this.addErrorToInput(nameInput);
        }

        // Validate email input
        if (emailInput.value && emailRegex.test(emailInput.value)) {
            this.removeErrorFromInput(emailInput);
        } else {
            isValid = false;
            this.addErrorToInput(emailInput);
        }

        // Validate message input
        if (messageInput.value) {
            this.removeErrorFromInput(messageInput);
        } else {
            isValid = false;
            this.addErrorToInput(messageInput);
        }

        return isValid;
    }
    , addErrorToInput: function(input) {
        if (!input.parentNode.classList.contains('form-group')) {
            throw 'Input must be within a form-group';
        }

        input.parentNode.classList.add('has-error');
    }
    , removeErrorFromInput: function(input) {
        if (!input.parentNode.classList.contains('form-group')) {
            throw 'Input must be within a form-group';
        }

        input.parentNode.classList.remove('has-error');
    }
    , send: function() {
        var form = document.getElementById('contactForm');
        var nameInput = form.querySelectorAll('input[name="name"]')[0];
        var emailInput = form.querySelectorAll('input[name="email"]')[0];
        var messageInput = form.querySelectorAll('textarea[name="message"]')[0];

        var successMessage = form.querySelectorAll('.form-success-message')[0];
        var errorMessage = form.querySelectorAll('.form-error-message')[0];

        if (this.isValid(nameInput, emailInput, messageInput)) {
            errorMessage.style.display = 'none';
            successMessage.style.display = 'inline-block';
            console.log('sending messag...');

            return false;
        }

        successMessage.style.display = 'none';
        errorMessage.style.display = 'inline-block';

        return false;
    }
};
