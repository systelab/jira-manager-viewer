(function(presenters)
{
    function PlanningPresenter(Context)
    {
        this.interactor = Context.getPlanningInteractor();
        this.interactorSettings = Context.getSettingsInteractor();
        this.interactorBoard = Context.getBoardInteractor();
       
        this.view = Context.getPlanningView(this);
        this.view.init();
    }

    Object.defineProperties(PlanningPresenter.prototype,
    {
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
        getIssues : {
            value: function(issues)
            {
                var self = this;
                    
                this.interactor.getIssues(issues, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onSubtasks(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        getSprint : {
            value: function(id)
            {
                var self = this;
                    
                this.interactorBoard.getSprint(id, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onSprint(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
    });

    presenters.PlanningPresenter = PlanningPresenter;
})(viewer.presenters);