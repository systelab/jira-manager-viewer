(function(presenters)
{
    function AnalysisPresenter(Context)
    {
        this.interactor = Context.getAnalysisInteractor();
        this.interactorSettings = Context.getSettingsInteractor();
        this.interactorBoard = Context.getBoardInteractor();
       
        this.view = Context.getAnalysisView(this);
        this.view.init();
    }

    Object.defineProperties(AnalysisPresenter.prototype,
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

    presenters.AnalysisPresenter = AnalysisPresenter;
})(viewer.presenters);