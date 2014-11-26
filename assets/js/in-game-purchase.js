// Define Main Application
JSoop.define('App', {
    singleton: true,
    // Called after class creation
    constructor: function () {
        var self = this;
        // Request Data from server module
        self.data = self.dataRequest().data;
        // Initialize Views
        self.initView();
        // Setup handlers for newly created DOM elements
        self.setupDOMElements();
    },
    // Setup handlers for created DOM elements
    setupDOMElements: function() {
        var self = this;
        // Close Button click handler
        jQuery('#close-main-container-button').click( function(eventData) {
            if (eventData.currentTarget.id === "close-main-container-button") {
                jQuery("#main-container").toggleClass("hidden");
            }
        });
        // Bind and set click events for Payment Methods Tab
        self.initPaymentMethodElements();
        // Set click event for creating a new Payment Method
        self.createPaymentMethodBind = JSoop.bind(self.createPaymentMethod, self);
        jQuery('#create-payment-method').click(self.createPaymentMethodBind);
        // Set click event for add a new payment method button to show a hidden tab
        jQuery('#add-new-payment-method-button').click(function (eventData) {
            eventData.preventDefault();
            jQuery('#new-payment-method-tab').tab('show');
        });
    },
    // Setup click events for created DOM elements with correct binding
    initPaymentMethodElements: function() {
        var self = this;
        // Set and bind default payment button
        self.setPaymentAsDefaultBind = JSoop.bind(self.setPaymentAsDefault, self);
        jQuery('.set-default-payment').click(self.setPaymentAsDefaultBind);
        // Set and bind delete payment button
        self.deletePaymentMethodBind = JSoop.bind(self.deletePaymentMethod, self);
        jQuery('.delete-payment-button').click(self.deletePaymentMethodBind);
        // Set and bind edit payment button
        self.editPaymentMethodExpDateBind = JSoop.bind(self.editPaymentMethodExpDate, self);
        jQuery('.edit-payment-button').click(self.editPaymentMethodExpDateBind);
        // Set and bind update exp date button
        self.updatePaymentMethodExpDateBind = JSoop.bind(self.updatePaymentMethodExpDate, self);
        jQuery('.confirm-payment-edit').click(self.updatePaymentMethodExpDateBind);
    },
    // Process edit payment method click event
    editPaymentMethodExpDate: function(eventData) {
        var self = this;
        eventData.preventDefault();
        var id = eventData.currentTarget.id.substr(eventData.currentTarget.id.length - 1);
        // Toggles display of input fields
        jQuery('#exp-date-'+id).addClass('hidden');
        jQuery('#exp-edit-container-'+id).removeClass('hidden');
    },
    // Process update exp button click event
    updatePaymentMethodExpDate: function (eventData) {
        var self = this;
        eventData.preventDefault();
        var id = eventData.currentTarget.id.substr(eventData.currentTarget.id.length - 1);
            month = jQuery('#exp-date-edit-month'+id).val(),
            year = jQuery('#exp-date-edit-year'+id).val();
        // Send update packet to server with new exp date
        server.updatePaymentMethodExpDate(self.data.payment_profiles[id].id, month, year);
        // Refresh data and views
        self.refresh();
    },
    // Process delete payment click event
    deletePaymentMethod: function(eventData) {
        var self = this;
        eventData.preventDefault();
        var id = eventData.currentTarget.id.substr(eventData.currentTarget.id.length - 1);
        // Send update packet to server with id to delete
        server.deletePaymentMethod(self.data.payment_profiles[id].id);
        // Refresh data and views
        self.refresh();
    },
    // Process set default click event
    setPaymentAsDefault: function(eventData) {
        var self = this;
        eventData.preventDefault();
        var id = eventData.currentTarget.id.substr(eventData.currentTarget.id.length - 1);
        // Send update packet to server with id to set as default
        server.setDefaultPaymentMethod(self.data.payment_profiles[id].id, self.data.id);
        // Refresh data and views
        self.refresh();
    },
    // Process create payment click event
    createPaymentMethod: function(eventData) {
        var self = this;
        eventData.preventDefault();
        // Create initial data packet
        var id = self.data.id,
            data = {
            action: 'createPaymentMethod',
            data: {
                account_id: id,
                last_four: jQuery('#cc-number-input').val(),
                cardType: 'Visa',
                exp_month: jQuery('#exp-date-input-month').val(),
                exp_year: jQuery('#exp-date-input-year').val()
            }
        };
        // Logic for determining if self will become a default profile
        if (self.data.payment_profiles.length === 0) {
            data.data.is_default = 1;
        } else {
            data.data.is_default = 0;
        }
        // Send data packet to server
        server.dataSendPM(data);
        // Refresh data and views
        self.refresh();
    },
    // Refreshes data and views
    refresh: function () {
        var self = this;
        // Clear data storage
        self.data = {};
        // Clear data containers
        jQuery('#payment-methods-container').empty();
        jQuery('.form-control').val('');
        // Fetch data from server
        self.data = self.dataRequest().data;
        // Process data and re-initialize views
        JSoop.each(self.data.payment_profiles, self.initPaymentMethods, self);
        // Determine which tab to default to.
        if (self.data.payment_profiles.length === 0) {
            jQuery('#new-payment-method-tab').tab('show');
        } else {
            jQuery('#payment-method-tab').tab('show');
        }
        // Re-initialize Payment Methods container
        self.initPaymentMethodElements();
    },
    // Sends a request to the server for data
    dataRequest: function () {
        var self = this;
        // Pulls id out of url where id = account id
        var match = RegExp('[?&]id=([^&]*)').exec(window.location.search),
            id = parseInt(decodeURIComponent(match[1].replace(/\+/g, ' ')));
        // Sends data object as request
        return server.dataRequest({ id: id });
    },
    // Initializing views
    initView: function() {
        var self = this;
        // Set RB Currency Amount - Hook available for data
        jQuery('#rb-amount').text('100');
        // Set Purchase History
        JSoop.each(self.data.charges, self.initCharges, self);
        // Fill Purchase History
        self.fillCharges();
        // Set Mayment Methods
        JSoop.each(self.data.payment_profiles, self.initPaymentMethods, self);
        // Chose Tab to display
        if (self.data.payment_profiles.length === 0) {
            jQuery('#new-payment-method-tab').tab('show');
        } else {
            jQuery('#payment-method-tab').tab('show');
        }
    },
    // Initialize Payment Methods tab
    initPaymentMethods: function(object, index) {
        var self = this;
        // Data that doesn't exist
        // object.full_name = 'Leeroy Jenkins-san';
        // object.postal_code = '33415';
        // Is self a default payment method?
        var setDefault = '',
            // Process and format exp date
            exp_date = moment(object.exp_month + ' ' + object.exp_year, 'M YYYY').format('MMMM YYYY'),
            editHtml,
            html
        // Add html for default payment method button if needed
        if (!object.is_default) {
            setDefault = '<button class="set-default-payment" id="set-default-payment-button-'+index+'">Set as Default</button>'
        }
        // Edit exp date html
        editHtml = [
            '<div class="form-group hidden" id="exp-edit-container-'+index+'">',
                '<div class="col-md-3 col-month-edit form-input">',
                    '<input class="form-control" id="exp-date-edit-month'+index+'" value="'+object.exp_month+'">',
                '</div>',
                '<div class="col-md-3 col-year-edit form-input">',
                    '<input class="form-control" id="exp-date-edit-year'+index+'" value="'+object.exp_year+'">',
                '</div>',
                '<div>',
                    '<button class="confirm-payment-edit" data-id="'+self.data.payment_profiles[index].id+'" id="confirm-input-'+index+'">Okay</button>',
                '</div>',
            '</div>'
        ].join('');
        // Payment method html
        html = ['<div class="payment-method-container container col-md-10 col-md-offset-1" id="payment-method-container-'+index+'">',
                    '<div class="form-group payment-methods-label">',
                        '<span class="col-md-6 col-left">Card Type</span>',
                        '<span class="col-md-6 col-right">'+object.card_type+'</span>',
                    '</div>',
                    /*'<div class="form-group payment-methods-label">',
                        '<span class="col-md-6 col-left">Full Name On Card:</span>',
                        '<span class="col-md-6 col-right">'+object.full_name+'</span>',
                    '</div>',*/
                    '<div class="form-group payment-methods-label">',
                        '<span class="col-md-6 col-left">Credit Card Number:</span>',
                        '<span class="col-md-6 col-right">**** **** **** '+object.last_four+'</span>',
                    '</div>',
                    '<div class="form-group payment-methods-label">',
                        '<span class="col-md-6 col-left">Expiration Date:</span>',
                        '<span id="exp-edit-date-'+index+'">'+editHtml+'</span>',
                        '<span id="exp-date-'+index+'" class="col-md-6 col-right">'+exp_date+'</span>',
                    '</div>',
                    /*'<div class="form-group payment-methods-label">',
                        '<span class="col-md-6 col-left">Zip / Postal Code:</span>',
                        '<span class="col-md-6 col-right">'+object.postal_code+'</span>',
                    '</div>',*/
                '</div>',
                '<div class="col-md-10 col-md-offset-1 pmc-button-container">',
                    '<button class="delete-payment-button" id="delete-payment-button-'+index+'">Delete</button>',
                    '<span class="pull-right"><button class="edit-payment-button" id="edit-payment-button-'+index+'">Edit</button>'+setDefault+'</span>',
                '</div>'
        ];
        // Add payment method to container
        jQuery('#payment-methods-container').append(html.join(''));
    },
    // Initialize charges view
    initCharges: function(object) {
        var self = this,
        // Variable initialization
            refund = new Date(object.refunded_at),
            charged = new Date(object.created_at),
            rbPackage,
            html = [],
            // Available currency types. Can be expanded upon.
            currencyTypes = {
                USD: '$',
                ERO: '€',
                GBP: '£'
            },
            price = object.amount / 100,
            // Format date and time for charge amount
            purchased = moment(charged.toISOString()).format('h:mm - DD/MM/YYYY'),
            key;
        // Do not display charge if refund was issued
        if (isNaN(refund)) {
            // Find correct RB Packge data
            for (key in self.data.packages) {
                if(object.package_id = self.data.packages[key].id) {
                    rbPackage = self.data.packages[key];
                }
            }
            // Create table row
            html = ['<tr>',
                    '<td>'+rbPackage.name+'</td>',
                    '<td>'+rbPackage.award_size+'</td>',
                    '<td class="price">'+price+'</td>',
                    '<td>'+purchased+'</td>',
                    '</tr>'
            ];
            // Add to purchase history table
            jQuery('#purchase-history-table').append(html.join(''));
            // Format currency
            jQuery('.price').formatCurrency({symbol: currencyTypes[object.currency_type]});
        }
    },
    // Fill rest of charge table to display at least 16 charges
    fillCharges: function () {
        var self = this,
        // Variable Initialization
            dataLength = 17 - self.data.packages.length,
            html;
        // Add blank html block
        for (i = 1; i < dataLength; i++) {
            html = ['<tr>',
                '<td> </td>',
                '<td> </td>',
                '<td class="price"> </td>',
                '<td> </td>',
                '</tr>'
            ];
            // Append to table
            jQuery('#purchase-history-table').append(html.join(''));
        }
    }
});