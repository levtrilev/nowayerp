# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e6]:
        - img [ref=e7]
        - generic [ref=e9]:
          - paragraph [ref=e10]: нафиг
          - paragraph [ref=e11]: ERP
      - generic [ref=e13]:
        - heading "Please log in to continue." [level=1] [ref=e14]
        - generic [ref=e15]:
          - generic [ref=e16]:
            - generic [ref=e17]: Email
            - generic [ref=e18]:
              - textbox "Email" [ref=e19]:
                - /placeholder: Enter your email address
                - text: user2@ya.ru
              - img
          - generic [ref=e20]:
            - generic [ref=e21]: Password
            - generic [ref=e22]:
              - textbox "Password" [active] [ref=e23]:
                - /placeholder: Enter password
                - text: "123456"
              - img
        - button "Log in" [ref=e24]:
          - text: Log in
          - img [ref=e25]
  - button "Open Next.js Dev Tools" [ref=e33] [cursor=pointer]:
    - img [ref=e34]
  - alert [ref=e39]
```