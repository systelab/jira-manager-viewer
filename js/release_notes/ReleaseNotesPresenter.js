(function(presenters)
{
    function ReleaseNotesPresenter(Context)
    {
        this.interactor = Context.getReleaseNotesInteractor();
        this.interactorSettings = Context.getSettingsInteractor();
        this.interactorBoard = Context.getBoardInteractor();
       
        this.view = Context.getReleaseNotesView(this);
        this.view.init();
    }

    Object.defineProperties(ReleaseNotesPresenter.prototype,
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
        getVersions : {
            value: function(project, startAt = 0)
            {
                var self = this;
                    
                this.interactor.getVersions(project, startAt, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onVersions(project, data);
						
						if(!data.isLast)
                        {
                            self.getVersions(project, startAt + data.values.length);
                        }
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        },
        getUserStories : {
            value: function(project, versionName, versionId)
            {
                var self = this;
                    
                this.interactor.getUserStories(project, versionName, new viewer.listeners.BaseDecisionListener(
                    function(data)
                    {
                        self.view.onUserStories(data, versionId);
                    },
                    function(data)
                    {
                        self.view.showError(data);
                    }));
            },
            enumerable: false
        }
    });

    presenters.ReleaseNotesPresenter = ReleaseNotesPresenter;
})(viewer.presenters);