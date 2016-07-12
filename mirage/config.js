import Ember from 'ember';
import Mirage from 'ember-cli-mirage';

export default function() {
  this.get('/accounts', (schema, request) => {
    const users = schema.users.all().models.map(user => Ember.merge(user.attrs, {type: 'user'}));
    const accounts = schema.accounts.all().models.map(account => account.attrs);

    return { accounts: users.concat(accounts) };
  });

  this.get('/users/:id', function({users}, request) {
    if(request.requestHeaders.Authorization === 'token testUserToken') {
      return this.serialize(users.find(request.params.id), 'v2');
    } else {
      return new Mirage.Response(403, {}, {});
    }
  });

  this.get('/users/permissions', (schema, request) => {
    const token = request.requestHeaders.Authorization.split(' ')[1];
    const user = schema.users.where({token}).models[0];

    if (user) {
      const permissions = schema.permissions.where({userId: user.id});

      return permissions.models.reduce((combinedPermissions, permissions) => {
        ['admin', 'push', 'pull', 'permissions'].forEach(property => {
          if (permissions.attrs[property]) {
            combinedPermissions[property].push(parseInt(permissions.repositoryId));
          }
        });

        return combinedPermissions;
      }, {
        admin: [],
        push: [],
        pull: [],
        permissions: []
      });
    } else {
      return {};
    }
  });

  this.get('/v3/broadcasts', (schema, request) => {
    return { broadcasts: [] };
  });

  this.get('/repos', function(schema, request) {
    return schema.repositories.all();
  });

  this.get('/owner/:login/repos', function(schema, request) {
    return schema.repositories.where({owner: request.params.login});
  });

  this.get('/repo/:slug_or_id', function(schema, request) {
    let slugOrId = decodeURIComponent(request.params.slug_or_id);
    let isId = parseInt(slugOrId);
    if (isId) {
      return schema.repositories.find(slugOrId);
    } else {
      let repos = schema.repositories.where({ slug: slugOrId });

      return {
        repo: repos.models[0].attrs
      };
    }
  });

  this.post('/repo/:repository_id/enable', function(schema, request) {
    let repo = schema.repositories.find(request.params.repository_id);
    if (repo) {
      repo.update('active', true);
      return repo;
    } else {
      return new Mirage.Response(404, {}, {});
    }
  });

  this.post('/repo/:repository_id/disable', function(schema, request) {
    let repo = schema.repositories.find(request.params.repository_id);
    if (repo) {
      repo.update('active', false);
      return repo;
    } else {
      return new Mirage.Response(404, {}, {});
    }
  });

  this.get('/v3/repo/:id/crons', function(schema, request) {
    return schema.crons.all();
  });

  this.get('/cron/:id');

  this.get('/repos/:id/settings', function(schema, request) {
    return this.serialize(schema.settings.where({repositoryId: request.params.id}).models[0], 'v2');
  });

  this.get('/repos/:id/caches', function(schema, request) {
    const caches = schema.caches.where({repositoryId: request.params.id});
    return this.serialize(caches, 'v2');
  });

  this.get('/settings/env_vars', function(schema, request) {
    const envVars = schema.envVars.where({repositoryId: request.queryParams.repository_id});

    return {
      env_vars: envVars.models.map(envVar => {
        envVar.attrs.repository_id = envVar.repositoryId;
        return envVar;
      })
    };
  });

  this.get('/settings/ssh_key/:repo_id', function(schema, request) {
    return this.serialize(schema.sshKeys.where({repositoryId: request.params.repo_id, type: 'custom'}).models[0], 'v2');
  });

  this.get('/v3/repo/:id', function(schema, request) {
    return schema.repositories.find(request.params.id);
  });

  this.get('/v3/repo/:id/branches', function(schema) {
    return schema.branches.all();
  });

  this.get('/repos/:id/key', function(schema, request) {
    const key = schema.sshKeys.where({repositoryId: request.params.id, type: 'default'}).models[0];
    return {
      key: key.attrs.key,
      fingerprint: key.attrs.fingerprint
    };
  });

  this.get('/jobs/:id', function(schema, request) {
    let job = schema.jobs.find(request.params.id);
    return this.serialize(job, 'v2-job');
  });

  this.get('/jobs');

  this.get('/builds', function(schema, request) {
    return {builds: schema.builds.all().models.map(build => {
      if (build.commit) {
        build.attrs.commit_id = build.commit.id;
      }

      return build;
    }), commits: schema.commits.all().models};
  });

  this.get('/builds/:id', function(schema, request) {
    const build = schema.builds.find(request.params.id);
    const response = {
      build: build.attrs,
      jobs: build.jobs.models.map(job => job.attrs)
    };

    if (build.commit) {
      response.commit = build.commit.attrs;
    }

    return response;
  });

  this.post('/builds/:id/restart', (schema, request) => {
    return {
      flash: [{notice: "The build was successfully restarted."}],
      result: true
    };
  });

  this.get('/v3/repo/:repo_id/builds', function(schema, request) {
    const branch = schema.branches.where({name: request.queryParams['branch.name']}).models[0];
    const builds = schema.builds.where({branchId: branch.id});

    /**
      * TODO remove this once the seializers/build is removed.
      * The modelName causes Mirage to know how to serialise it.
      */
    return this.serialize({
      models: builds.models.reverse(),
      modelName: 'build'
    }, 'v3');
  });

  this.get('/jobs/:id/log', function(schema, request) {
    let log = schema.logs.find(request.params.id);
    if(log) {
      return { log: { parts: [{ id: log.attrs.id, number: 1, content: log.attrs.content}] }};
    } else {
      return new Mirage.Response(404, {}, {});
    }
  });

  // UNCOMMENT THIS FOR LOGGING OF HANDLED REQUESTS
  // this.pretender.handledRequest = function(verb, path, request) {
  //   console.log("Handled this request:", `${verb} ${path}`, request);
  //   try {
  //     const responseJson = JSON.parse(request.responseText);
  //     console.log(responseJson);
  //   } catch (e) {}
  // };
}

/*
You can optionally export a config that is only loaded during tests
export function testConfig() {

}
*/
