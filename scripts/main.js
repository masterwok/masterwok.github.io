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
// resumeApp.wowInstance = new WOW();
// resumeApp.wowInstance.init();

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
        // Form elements
        var form = document.getElementById('contactForm');
        var nameInput = form.querySelectorAll('input[name="name"]')[0];
        var emailInput = form.querySelectorAll('input[name="email"]')[0];
        var messageInput = form.querySelectorAll('textarea[name="message"]')[0];

        // Form state messages
        var successMessage = form.querySelectorAll('.form-success-message')[0];
        var responseErrorMessage = form.querySelectorAll('.form-response-error-message')[0];
        var fieldErrorMessage = form.querySelectorAll('.form-field-error-message')[0];
        var pendingMessage = form.querySelectorAll('.form-pending-message')[0];

        // Clear any previous messages
        fieldErrorMessage.style.display =
            responseErrorMessage.style.display =
            fieldErrorMessage.style.display =
            pendingMessage.style.display = 'none';

        // Only send if form values are correct
        if (!this.isValid(nameInput, emailInput, messageInput)) {
            successMessage.style.display = 'none';
            responseErrorMessage.style.display = 'none';
            fieldErrorMessage.style.display = 'inline-block';
            return false;
        }

        // Init request object and prepare data
        var xhr = new XMLHttpRequest();
        var data = JSON.stringify({
            name: nameInput.value
            , email: emailInput.value
            , message: messageInput.value
        });

        // Handle response
        xhr.onreadystatechange = function() {

            // readyState === 4 means request is finished
            if (xhr.readyState === 4) {
                pendingMessage.style.display = 'none';
                responseErrorMessage.style.display = 'none';

                if (xhr.status === 200) {
                    // Oh yeahhhhhhh (kool-aid man voice)
                    fieldErrorMessage.style.display = 'none';
                    successMessage.style.display = 'inline-block';
                } else {
                    // Oh noooooo
                    responseErrorMessage.style.display = 'inline-block';
                    successMessage.style.display = 'none';
                }
            }
        };

        // Make the request
        xhr.open('POST', 'https://formspree.io/jonathan.trowbridge@gmail.com', true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
        xhr.send(data);

        // Show pending message (will be cleared in onreadystatechange() event above)            
        pendingMessage.style.display = 'inline-block';

        return false;
    }
};
