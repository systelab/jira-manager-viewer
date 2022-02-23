(function(presenters)
{
    function SprintPresenter(Context)
    {
        this.interactor = Context.getSprintInteractor();
        this.interactorSettings = Context.getSettingsInteractor();
       
        this.view = Context.getSprintView(this);
        this.view.init();
    }

    Object.defineProperties(SprintPresenter.prototype,
    {
		getIssueTypes : {
            value: function()
            {
                var self = this;
                    
                this.interactor.getIssueTypes(new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onIssueTypes(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        getSprints : {
            value: function(board, startAt = 0)
            {
                var self = this;
                    
                this.interactor.getSprints(board, startAt, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.load(data);
						
						if(!data.isLast)
                        {
                            self.getSprints(board, startAt + data.values.length);
                        }
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        getIssues : {
            value: function(board, sprint, issuetypes)
            {
                var self = this;
                
                this.interactor.getIssues(board, sprint, issuetypes, new viewer.listeners.BaseDecisionListener(
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
        }
    });

    presenters.SprintPresenter = SprintPresenter;
})(viewer.presenters);