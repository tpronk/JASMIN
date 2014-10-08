JASMIN
======

How this repository is structured:
* **legacy** The old JASMIN; not open source
* **master** The current JASMIN; refactored, documented, and released open source
  * **api_docs** API documentation of each JASMIN module based on JSDoc 3
  * **experiments** Small scripts to try out things
  * **minified** Minified version of jasmin_core (via Closure compiler)
  * **source** Source code
    * **jasmin_apps** Applications built with JASMIN
    * **jasmin_core** The JASMIN library
    * **jasmin_demos** Demos showing features of each JASMIN module
    * **jasmin_ext** External library used in JASMIN (such as jQuery and Screenfull)


JASMIN Upgrade: Goals
=====================
The legacy JASMIN library has a lot of features and works quite well. However, this library is not open source, not very easy to use, and a bit outdated in some regards. The master JASMIN library aimed to be open surce, proving upgraded modules that are accessible and up-to-date.

JASMIN Architecture
===================
The graph below shows the JASMIN architecture. An arrow from module A tomodule B means that A requires B. All modules except those marked with a star require jQuery. Green modules have been upgraded and red modules are still to go.


JASMIN Approach
===============
Each of the JASMIN modules:
1. Is refactored and upgraded
2. Has the API is documented via JSDoc, see: master/apidocs
3. Is demoed and tested via one or more examples, see master/source/jasmin_demos

In a later stage, JASMIN applications are built to illustrate how the library can be used to program a response time tasks. As apps evolve we hope to have them serve as more complex examples and provide guidelines for best practices.
