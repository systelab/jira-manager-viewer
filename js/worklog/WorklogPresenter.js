(function(presenters)
{
    function WorklogPresenter(Context)
    {
        this.interactor = Context.getWorklogInteractor();
       
        this.view = Context.getWorklogView(this);
        this.view.init();
    }

    Object.defineProperties(WorklogPresenter.prototype,
    {
		getIssue : {
            value: function(key, value)
            {
                var self = this;
                    
                this.interactor.getIssue(key, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onIssue(data, value);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        getIssues : {
            value: function(issues, projects)
            {
                var self = this;
                
                this.interactor.getIssues(issues, projects, new viewer.listeners.BaseDecisionListener(
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
        getWorklog : {
            value: function(fromRaw, toRaw)
            {
                var self = this;
                
                this.interactor.getWorklog(fromRaw, toRaw, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onWorklog(data);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        getWorklogList : {
            value: function(ids)
            {
                var self = this;
                
                this.interactor.getWorklogList(ids, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onWorklogList(data);
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