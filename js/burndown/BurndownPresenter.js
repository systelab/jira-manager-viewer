(function(presenters)
{
    function BurndownPresenter(Context)
    {
        this.interactor = Context.getBurndownInteractor();
        this.interactorSettings = Context.getSettingsInteractor();
        this.interactorBoard = Context.getBoardInteractor();
       
        this.view = Context.getBurndownView(this);
        this.view.init();
    }

    Object.defineProperties(BurndownPresenter.prototype,
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
        getWorklog : {
            value: function(beginDate, endDate)
            {
                var self = this;
                    
                this.interactor.getWorklogModified(beginDate, endDate, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        var ids = [];
                        $.each( data.values, function( key, value )
                        {
                            if(value.updatedTime < endDate)
                            {
                                ids.push(value.worklogId);
                            }
                        });

                        if(ids.length > 0)
                        {
                            self.interactor.getWorklogList(ids, new viewer.listeners.BaseDecisionListener(
                                function(data)
                                {
                                    self.view.onWorklog(data);
                                    
                                    //self.view.onWorklogList(data);
                                },
                                function(data)
                                {
                                    self.view.showError(data);
                                }));
                        }
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
    });

    presenters.BurndownPresenter = BurndownPresenter;
})(viewer.presenters);