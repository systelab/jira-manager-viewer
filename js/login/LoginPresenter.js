(function(presenters)
{
    function LoginPresenter(Context)
    {
        this.interactor = Context.getLoginInteractor();
       
        this.loginView = Context.getLoginView(this);
        this.loginView.init();

        //this.networkView = Context.getNetworkPresenter().networkView;
    }

    Object.defineProperties(LoginPresenter.prototype,
    {
        login : {
            value: function(server, user, password)
            {
                var self = this;
                    
                this.interactor.login(server, user, password, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        credentials = data;

                        self.loginView.load(data);
                    },
                    function(data)
                    {
                        self.loginView.showError(data);
                    }));
            },
            enumerable: false
        },
        checkToken : {
            value: function()
            {
                var self = this;
                    
                this.interactor.getToken(new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        credentials = data;

                        self.loginView.load(data);
                    },
                    function(data)
                    {
                        
                    }));
            },
            enumerable: false
        }
    });

    presenters.LoginPresenter = LoginPresenter;
})(viewer.presenters);