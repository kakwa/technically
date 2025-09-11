+++
title = 'Fleet Management at scale: Integrating OpenFeature with SaltStack or Ansible'
date = 2024-11-30T16:27:05+01:00
draft = true
summary = 'Experimenting with feature flags'
+++

# Introduction

## A Cautionary Tale

On 19 July 2024, a faulty update from CrowdStrike crashed millions of Windows computers around the World, disrupting industries ranging from retail and healthcare to air transport and manufacturing. 

While many measure could have helped prevent this incident, in truth, even with state-of-the-art implementation, testing and QA practices, shit can still hit the fan.

But among the many things CrowdStrike could have done better, one, in my opinion, resonate more than others: **staggered rollouts**.

By using  staggered rollouts, the blast radius of the faulty update could have been dramatically reduced.
Instead of impacting millions of machines, the update could have been stopped early by switching a **flag**, limiting the damage to a smaller number of devices—perhaps a few thousand at most.
While this would still result in some unhappy customers, it’s a far better outcome than making global headlines for all the wrong reasons.

## The Reality of Production

Fortunately for our stress levels, most of us Software or System Engineers don't deal with millions of devices scale deployments. 
Unfortunately, in the age of AWS, we still often deal with hundreds if not thousands of servers, and high paying enterprise customers.

At these kinds of scale, manually sshing into every server one by one and applying and checking updates consistently is not feasible.

At first, a bit of scripting and a rough deployment strategy such as geo/region or static lists of servers to do staggered rollouts could work. 

But this too has its limits, and at some points you will need some dedicated tooling.

Enters Configuration Management solutions such as [SaltStack](https://docs.saltproject.io/en/latest/contents.html), [Ansible](https://docs.ansible.com/ansible/latest/index.html), [Puppet](https://www.puppet.com/docs/puppet/8/puppet_index), [Chef](https://docs.chef.io/) or [CFEngine](https://docs.cfengine.com/docs/3.24/) and the [OpenFeature Standard](https://openfeature.dev/).

## What is OpenFeature?

While Ansible&co needs no introduction, OpenFeature is probably less known.

[OpenFeature](https://openfeature.dev/) is a project under the [Cloud Native Computing Foundation](https://www.cncf.io/projects/openfeature/).

It's goal is vendor-independent Feature Flag SDKs for all major languages and frameworks.

It's architectured around two main components:
* **Evaluation Layer**: A fully standardized layer with stable, developer-friendly APIs for feature wrapping. 
* **Provider Layer**: A vendor-specific translation layer between the Evaluation Layer and a Feature Flag Management Tool. 

This design makes it easy to switch vendors—just update the provider initialization without reworking the Feature Flag logic.

Additionally, OpenFeature provides advanced features like context-aware flag queries, hooks, and event handling.
While all that might seem over-engineered, Feature Flags is one of these functionalities looking simple, but actually difficult to get right.

Example:
```python
# configure a provider
api.set_provider(SomeProvider(params))

# create a client
client = api.get_client()

# get a bool flag value
flag_value = client.get_boolean_value("v2_enabled", False)

# use flag to enable/disable the feature
if flag_value: 
    print("fancy new feature")
else:
    print("boring old code")
```

OpenFeature is already widely supported by the industry, and most open source or commercial tools such as [LaunchDarkly](https://docs.launchdarkly.com/), [GO Feature Flag](https://gofeatureflag.org/docs) or [Flagsmith](https://docs.flagsmith.com/) have created officially supported providers.

In addition, OpenFeature also provides it's own Feature Flag Management Tool called [flagd](https://github.com/open-feature/flagd), which we will leverage in this post.

For more details, visit the [openfeature.dev](https://openfeature.dev/docs/reference/intro) Documentation.

## Actually, this is no Feature Flag

I'm more of an infrastructure guy (SRE, Devops, CloudOps, Infra Dev, pick your poison), so here, I'm actually not interested in using Feature Flags in the traditional "in-code on/off switch to wrap a feature in" sense.

I'm much more interested in the safe paradigm these SDKs offers: sane defaults and none-blocking if the Feature Flag Management Service is down.

But what particularly interests me is the rule engines these Feature Flag Management Services usually provides.

I want to leverage these rules to have deployments be as hands-off as possible, while still being controllable.

Here is my unsorted and incomplete wish list of the kind of :
* filter on environment ownership (internal, non-paying customers, paying customers, etc)
* ability to call external APIs such as a ticketing system to exclude environment currently experiencing issue
* ability to hook monitoring, to automatically stop a rollout in case something abnormal is occurring
* ability to select a percentage of each population
* ability to call external APIs to get the available flag values (for example, the versions of a software available in a repository)
* ability to restrict waves by time shifts & days, to trigger deployments when experts are on hand to deal with potential issues and when the update is less risky for business
* have some kind of "fatigue" metric, so that it's not always the same customer/environment being used as canaries
* have manual exclusion lists

I’m also particularly interested in the reporting capabilities these tools provide.
Insights like success and failure rates, active deployments, the number of environments in each wave, and progress metrics are incredibly valuable—not just for internal monitoring but also for sharing with stakeholders.

# At last, some technical bits

## flagd
