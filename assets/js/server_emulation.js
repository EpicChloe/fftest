JSoop.define('server', {
    singleton: true,
    statics: {
        accounts: [{'id': 1,'email': 'larry@fake.com'}, {'id': 2,'email': 'moe@fake.com'}, {'id': 3,'email': 'curly@fake.com'}],
        charges: [{'id': 1,'payment_profile_id': 1,'package_id': 3,'currency_type': 'USD','amount': 95000,'created_at': '2012-05-08 15:16:10','refunded_at': '0000-00-00 00:00:00'}, {'id': 2,'payment_profile_id': 1,'package_id': 1,'currency_type': 'USD','amount': 500,'created_at': '2012-07-18 17:32:56','refunded_at': '2012-07-19 11:15:41'}, {'id': 3,'payment_profile_id': 2,'package_id': 2,'currency_type': 'USD','amount': 5000,'created_at': '2012-08-07 08:37:10','refunded_at': '0000-00-00 00:00:00'}, {'id': 4,'payment_profile_id': 1,'package_id': 2,'currency_type': 'USD','amount': 5000,'created_at': '2012-09-01 12:20:49','refunded_at': '0000-00-00 00:00:00'}, {'id': 5,'payment_profile_id': 3,'package_id': 1,'currency_type': 'USD','amount': 400,'created_at': '2012-07-10 16:18:54','refunded_at': '0000-00-00 00:00:00'}],
        packages: [{'id': 1,'name': 'Aranha Red Bean Booster','cost': 500,'currency_type': 'USD','award_size': 40}, {'id': 2,'name': 'Thresher Red Bean Booster','cost': 5000,'currency_type': 'USD','award_size': 168}, {'id': 3,'name': 'Brontodon Red Bean Booster','cost': 10000,'currency_type': 'USD','award_size': 960}],
        payment_profiles: [{'id': 1,'account_id': 1,'last_four': 1234,'card_type': 'Visa','exp_month': 5,'exp_year': 2015,'is_default': 1}, {'id': 2,'account_id': 1,'last_four': 4242,'card_type': 'AMEX','exp_month': 9,'exp_year': 2014,'is_default': 0}, {'id': 3,'account_id': 3,'last_four': 1432,'card_type': 'Mastercard','exp_month': 9,'exp_year': 2020,'is_default': 1}]
    },
    dataRequest: function(config) {
        var self = this;
        var response = {
            status: 200,
            data: {
                id: '',
                email: '',
                packages: [],
                payment_profiles: [],
                charges: []
            }
        };

        for (var key in self.statics.accounts) {
            if (self.statics.accounts[key].id === config.id) {
                response.data.id = self.statics.accounts[key].id;
                response.data.email = self.statics.accounts[key].email;
            }
        }

        if (response.data.id === '') {
            return {status: 400};
        }

        response.data.packages = self.statics.packages;

        for (var key in self.statics.payment_profiles) {
            if (self.statics.payment_profiles[key].account_id === config.id) {
                response.data.payment_profiles.push(self.statics.payment_profiles[key]);
            }
        }

        for (var key in self.statics.charges) {
            for (var key2 in response.data.payment_profiles) {
                if (self.statics.charges[key].payment_profile_id === response.data.payment_profiles[key2].id) {
                    response.data.charges.push(self.statics.charges[key]);
                }
            }
        }

        return response;
    },
    dataSendPM: function(object) {
        var self = this;
        var last_four,
            exp_month,
            exp_year
        last_four = parseInt(object.data.last_four.substr(object.data.last_four.length - 4));
        exp_month = parseInt(moment(object.data.exp_month, ['M', 'MM', 'MMM', 'MMMM']).format('M'));
        exp_year = parseInt(moment(object.data.exp_year, ['YY', 'YYYY']).format('YYYY'));

        paymentProfileId = Math.floor(Math.random() * (2000 - 10)) + 10;

        self.statics.payment_profiles.push({
            'id': paymentProfileId,
            'account_id': object.data.account_id,
            'last_four': last_four,
            'card_type': object.data.cardType,
            'exp_month': exp_month,
            'exp_year': exp_year,
            'is_default': object.data.is_default
        });

    },
    updatePaymentMethodExpDate: function (id, month, year) {
        var self = this;
        for (var key in self.statics.payment_profiles) {
            if (self.statics.payment_profiles[key].id === id) {
                self.statics.payment_profiles[key].exp_month = parseInt(moment(month, ['M', 'MM', 'MMM', 'MMMM']).format('M'));
                self.statics.payment_profiles[key].exp_year = parseInt(moment(year, ['YY', 'YYYY']).format('YYYY'));
            }
        }

    },
    deletePaymentMethod: function(id) {
        var self = this;
        for (var key in self.statics.payment_profiles) {
            if (self.statics.payment_profiles[key].id === id) {
                self.statics.payment_profiles.splice(key, 1);
            }
        }
    },
    setDefaultPaymentMethod: function (id, account_id) {
        var self = this;
        for (var key in self.statics.payment_profiles){
            if (self.statics.payment_profiles[key].account_id == account_id) {
                self.statics.payment_profiles[key].is_default = 0;
            }
        }
        for (var key in self.statics.payment_profiles) {
            if (self.statics.payment_profiles[key].id === id) {
                self.statics.payment_profiles[key].is_default = 1;
            }
        }
    }
});