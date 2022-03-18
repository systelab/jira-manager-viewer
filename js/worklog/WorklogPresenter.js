(function(presenters)
{
    function WorklogPresenter(Context)
    {
        this.interactor = Context.getWorklogInteractor();
        this.interactorSettings = Context.getSettingsInteractor();
	   
        this.view = Context.getWorklogView(this);
        this.view.init();
    }

    Object.defineProperties(WorklogPresenter.prototype,
    {
		getIssues : {
            value: function(projects, fromRaw, toRaw)
            {
                var self = this;
                
                this.interactor.getIssues(projects, fromRaw, toRaw, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onIssues(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        getProjects : {
            value: function()
            {
                var self = this;
                
                this.interactor.getProjects(new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onProjects(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        getSettings : {
            value: function()
            {
                var self = this;
                    
                this.interactorSettings.load(new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onLoadSettings(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        setSetting : {
            value: function(setting, value)
            {
                var self = this;
                this.interactorSettings.load(new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        data[setting] = value;
                        
                        self.interactorSettings.save(data, new viewer.listeners.BaseDecisionListener(
                        function()
                        {
                            self.view.onSaveSetting(data);
                        },
                        function(data)
                        {
                            self.view.showError(data);
                        }));
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        }
    });

    presenters.WorklogPresenter = WorklogPresenter;
})(viewer.presenters);